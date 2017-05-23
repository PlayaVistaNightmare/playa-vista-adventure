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
      clueLocation: null, //long, lat, radius
      location: null,
      errorMessage: null,
      distance: 0,//prop dont need
      cluesCompleted: []
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

  _startPressed = () => {
    console.log('start pressed!');
    // start game, assign random clue to state
    clue.getRandomIncompletedClue()
    .then((clue) => {
      this.setState({
        isGameStarted: true,
        clue: clue.description,
        clueId: clue.id,
        clueLocation: {longitude: clue.long, latitude: clue.lat, radius: clue.radius},
      })
    })
  };

  _checkInPressed = () => {
    console.log('check in pressed!');
    this._getLocationAsync();
    let distToClue = Loc.calculateDistanceInFeetBetweenCoordinates(
      this.state.location.coords.latitude,
      this.state.location.coords.longitude,
      this.state.clueLocation.latitude,
      this.state.clueLocation.longitude);
    console.log('location: ', this.state.location);
    console.log('clueLocation', this.state.clueLocation);
    console.log('distToClue: ',distToClue);
    console.log('radius: ',this.state.clueLocation.radius);
    if (distToClue <= this.state.clueLocation.radius) {
      clue.setToComplete(this.state.clueId)
      .then(()=>{ //can refactor later to NOT have .then in .then
        clue.getRandomIncompletedClue()
        .then((clue) => {
          let newState = Object.assign({},this.state,{
            isGameStarted: true,
            clue: clue.description,
            clueId: clue.id,
            clueLocation: {longitude: clue.long, latitude: clue.lat, radius: clue.radius},
            cluesCompleted: [
              ...this.state.cluesCompleted,
              clue
            ]
          });
          console.log('newState: ',newState);
          this.setState(newState);
        })
      });
      setState({ cluesCompleted: completed });
    }
    else {
      console.log('not in correct location!');
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
