import React from 'react';
import { Platform, StyleSheet, Text, View, StatusBar } from 'react-native';
import { MapView, Constants, Location, Permissions, SQLite } from 'expo';
import ClueDescription from './components/ClueDescription';
import ClueOverlay from './components/ClueOverlay';
import CheckInButton from './components/CheckInButton';
import clue from './controllers/clueModel';
import StartButton from './components/StartButton';
import Loc from './util/locationUtil';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isGameStarted: false,
      clue: 'WHAAATATAA',
      clueId: null,
      clueLocation: null,
      location: null,
      errorMessage: null,
      distance: 0,
      cluesCompleted: 0
    }
  }

  componentWillMount() {
    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
      });
    } else {
      this._getLocationAsync();
      this._watchPositionAsync();
      clue.populateCluesIfEmpty();
    }
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({ errorMessage: 'Permission to access location was denied',});
    }

    let location = await Location.getCurrentPositionAsync({});
    this.setState({ location });
  };

  _watchPositionAsync = async () => {
    await Location.watchPositionAsync({ enableHighAccuracy: true, distanceInterval: 4 },
      (location) => {
        this.setState({ location });
      });
  };

  _distanceInFeetBetweenEarthCoordinates = (lat1, lon1, lat2, lon2) => {
    let distance = Loc.calculateDistanceInFeetBetweenCoordinates(lat1,lon1,lat2,lon2);
    this.setState({ distance });
    return distance;
  }

  _getSavedClue = () => {
    console.log('getting saved clue');

    // If user played before, continue where the user left off.
    db.transaction(tx => {
      tx.executeSql('select curr_clue from user;',
        [],
        (_, result) => {
          if (result.rows.length) {
            let clueId = result.rows.item(0);
            db.transaction(getClueDescription => {
              getClueDescription.executeSql(`select * from clue inner join on location where clue.location_id = location.id and clue.id = ?;`,
                [clueId],
                (_, description_Result) => {
                  if (description_Result.rows.length) {
                    let record = description_Result.rows.item(0);
                    console.log(record);
                    this.setState({
                      isGameStarted: true,
                      clue: record.description,
                      clueId: clueId,
                      clueLocation: {
                        latitude: record.latitude,
                        longitude: record.longitude,
                        placename: record.place_name,
                        radius: record.radius
                      }
                    });
                  }
                  return true;
                });
            });
          }
          else {
            return false;
          }
        });
    });
  };

  _getNewClue = () => {
    console.log('getting new clue');
    db.transaction(tx => {
      tx.executeSql(`select *
                     from clue inner join location on clue.location_id = location.id where completed = 0;`,
        [],
        (_, result) => {
          console.log(result);
          if (result.rows.length) {
            let randIndex = Math.floor(Math.random() * result.rows.length);

            if (this.state.cluesCompleted === 0)
              randIndex = 0;

            let record = result.rows.item(randIndex);
            console.log(randIndex);
            console.log(record);
            this.setState({
              isGameStarted: true,
              clue: record.description,
              clueId: record.id,
              clueLocation: {
                latitude: record.latitude,
                longitude: record.longitude,
                placename: record.place_name,
                radius: record.radius
              }
            });
          }
        }, (tx, err) => {
          console.log(err);
        });
    });
  };

  _startPressed = () => {
    console.log('start pressed!');
    // start game, assign random clue to state
    
    if (!this._getSavedClue()) {
      this._getNewClue();
    }
    this.setState({ isGameStarted: true });
  };

  _checkInPressed = () => {
    console.log('check in pressed!');
    this._getLocationAsync();
    if (this._distanceInFeetBetweenEarthCoordinates(this.state.location.coords.latitude,
      this.state.location.coords.longitude,
      this.state.clueLocation.latitude,
      this.state.clueLocation.longitude) <= this.state.clueLocation.radius) {
      this._getNewClue();
      console.log('location found!');
      let completed = this.state.cluesCompleted;
      completed++;
      this.setState({ cluesCompleted: completed });
    }
    else {
      console.log('location not found!');
    }
  };

  render() {
    if (this.state.location == null) {
      return (<View style={styles.container} />);
    }
    else {
      return (

        <View style={styles.container}>
          <StatusBar hidden />
          {/*<Text>TEST ----></Text>
          <Text>USER LAT: {this.state.location.coords.latitude}</Text>
          <Text>USER LONG: {this.state.location.coords.longitude}</Text>
          <Text>CLUE LAT: {this.state.clueLocation ? this.state.clueLocation.latitude : ''}</Text>
          <Text>CLUE LONG: {this.state.clueLocation ? this.state.clueLocation.longitude : ''}</Text>
                    <Text>DISTANCE: { this.state.distance }</Text>*/}

          <MapView
            style={styles.mapView}
            provider={'google'}
            region={{
              latitude: this.state.location.coords.latitude,
              longitude: this.state.location.coords.longitude,
              latitudeDelta: 0,//0.0922,
              longitudeDelta: 0.01//0.0421,
            }}
          >

            <MapView.Circle
              radius={20}
              fillColor={'#00F'}
              center={{
                latitude: this.state.location.coords.latitude,
                longitude: this.state.location.coords.longitude
              }}
            />
          </MapView>
          {
            this.state.isGameStarted &&
            <CheckInButton style={styles.checkInButton} checkIn={this._checkInPressed} />
          }

          {
            this.state.isGameStarted ?
              null :
              <StartButton
                style={styles.startButton}
                startGame={this._startPressed}
              />
          }
          {
            this.state.isGameStarted &&
            <ClueOverlay style={styles.clueOverlay} clue={this.state.clue} cluesCompleted={this.state.cluesCompleted} />
          }
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#000',
    // alignItems: 'center',
    // justifyContent: 'center',
  },

  mapView: {
    flex: 30
  },
  startButton: {
    // backgroundColor: 'red',
    // width: 80,
    // height: 80,
    // position: 'absolute',
    // bottom: 160,
    // alignSelf: 'center'
  },
  clueOverlay: {
    // flex: 1,
    height: 32,
    backgroundColor: '#01579B',

  },
  checkInButton: {
    // color: 'green',
    // backgroundColor: 'green',
    height: 80,
    width: 80,
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center'
  }
});
