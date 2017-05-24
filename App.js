import React from 'react';
import { Platform, StyleSheet, Text, View, StatusBar, AlertIOS, FlatList, Button, AsyncStorage } from 'react-native';
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
      clue: null,
      clueId: null,
      clueLocation: null, //long, lat, radius
      location: null,
      errorMessage: null,
      distance: 0,//prop dont need
      cluesCompleted: [],
      viewingClues: false,
      allCluesCount: 0
    }
    this.toggleCluesList = this.toggleCluesList.bind(this)
  }

  componentWillMount() {
    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
      });
    } else {
      console.log('componentWillMount')
      this._getLocationAsync();
      this._watchPositionAsync();
      // AsyncStorage.clear()

      clue.populateCluesIfEmpty()
      .then(() => clue.getCompleted())
      .then(clues => {
          this.setState(Object.assign({}, this.state, {cluesCompleted: [
            ...this.state.cluesCompleted,
            ...clues
          ]}))
          console.log('Init state: ',this.state)
          return clue.getAllClues()
        })
        .then((res) => {
          this.setState({allCluesCount: res.length})
        });
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
    console.log('start press')
    let clueChunk;
    clue.getRandomIncompletedClue()
    .then((randClue) => {
      if (!randClue) {
        AlertIOS.alert('Finished!......?', 'NOPE')
        return clue.getChunk();
        console.log('clueChunk in startpres: ', clueChunk);
      } else{
        return Promise.resolve(randClue);
      }
    })
    .then((newClue) =>{ //get chunk may return false. handle this later
      if(newClue){
        console.log('setting new clue', newClue)
        this.setState({
          isGameStarted: true,
          clue: newClue.description,
          clueId: newClue.id,
          clueLocation: {longitude: newClue.long, latitude: newClue.lat, radius: newClue.radius},
          currentClue: newClue
        })
      } else {
        AlertIOS.alert('Stop hitting start, you\'re DONE!');
      }
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
      console.log('completing clueId: ', this.state.clueId)
      clue.setToComplete(this.state.clueId)
      .then(()=>{ //can refactor later to NOT have .then in .then
          console.log()
          let newState = Object.assign({},this.state,{
            cluesCompleted: [
              ...this.state.cluesCompleted,
              this.state.currentClue
            ]
          });
          this.setState(newState);
        return clue.getRandomIncompletedClue()
      })
      .then((randClue) => {
        if (!randClue) {
          AlertIOS.alert('Finished!......?', 'NOPE')
          return clue.getChunk();
          console.log('clueChunk in startpres: ', clueChunk);
        } else{
            return Promise.resolve(randClue);
        }
      })
      .then((newClue) =>{ //get chunk may return false. handle this later
        if(newClue){
          console.log('setting new clue', newClue)
          this.setState({
            isGameStarted: true,
            clue: newClue.description,
            clueId: newClue.id,
            clueLocation: {longitude: newClue.long, latitude: newClue.lat, radius: newClue.radius},
            currentClue: newClue
          })
        } else {
          AlertIOS.alert('OK you\'re done.' );
        }
      });
    }
    else {
      AlertIOS.alert('No Fresh Meat Here!', 'Not in correct location!')
      console.log('not in correct location!');
    }
  };

  toggleCluesList() {
    this.setState(Object.assign({}, this.state, {
      viewingClues: !this.state.viewingClues
    }))
  }

  render() {
    if (this.state.location == null) {
      return (<View style={styles.container} />);
    }
    else {
      return (

        <View style={styles.container}>
          <StatusBar hidden />
          <Button
            onPress={this.toggleCluesList}
            title="Completed Clues"
            color="black"
          />
          {
              this.state.viewingClues && <FlatList 
              style={styles.listView} 
              data={this.state.cluesCompleted} 
              keyExtractor={item => item.id}
              renderItem={({item}) => 
                <Text style={{color: 'black', padding: 8, fontWeight: 'bold', textAlign:'left', borderBottomColor:'gray'}}>
                  {item.place_name}: 
                  <Text style={{color: 'black', padding: 8 ,fontWeight: '100', textAlign:'right'}}>
                    {item.description}
                  </Text>
                </Text>
                
                
                } 
                />
          }
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
            <MapView.Marker
              image = {require('./assets/zombie.png')}
              coordinate={{
                latitude: this.state.location.coords.latitude,
                longitude: this.state.location.coords.longitude
                }}
            />

            <MapView.Circle
              radius={20}
              fillColor={'red'}
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
                startstyle={styles.startView}
                startGame={this._startPressed}
              />
          }
          {
            this.state.isGameStarted &&
            <ClueOverlay style={styles.clueOverlay} 
            clue={this.state.clue} 
            cluesCompleted={this.state.cluesCompleted} 
            allLength={this.state.allCluesCount} 
            />
          }
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  listView: {
    height: 100,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#d6d7da',
    backgroundColor: 'white'
  },
  mapView: {
    flex: 30,
  },
  startView: {
    backgroundColor: 'black',
    height: 600,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  clueOverlay: {
    // flex: 1,
    height: 72,
    backgroundColor: '#a0d9de',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center'

  },
  checkInButton: {
    // backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 60,
    alignSelf: 'center',
    position: 'absolute'

  }
});
