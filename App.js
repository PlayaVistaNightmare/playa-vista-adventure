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
      viewingClues: false,
      userLocation: null,
      currentClue: null,
      cluesCompleted: [],
      allCluesCount: 0,
      errorMessage: null,
    }
    this.toggleCluesList = this.toggleCluesList.bind(this);
  }

  componentWillMount() {
    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage: 'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
      });
    } else {
      this._getLocationAsync();
      this._watchPositionAsync();
      clue.populateCluesIfEmpty()
      .then(() => clue.getCompleted())
      .then(clues => {
          this.setState(Object.assign({}, this.state, {cluesCompleted: [
            ...this.state.cluesCompleted,//may not need this?
            ...clues
          ]}))
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
    let userLocation = await Location.getCurrentPositionAsync({});
    this.setState({ userLocation });
  };

  _watchPositionAsync = async () => {
    await Location.watchPositionAsync({ enableHighAccuracy: true, distanceInterval: 4 },
      (userLocation) => {
        this.setState({ userLocation });
      });
  };

  _getNextClue = () => {
    clue.getRandomIncompletedClue()
    .then( randClue => randClue ? Promise.resolve(randClue) : clue.getChunk() )
    .then( newClue =>{ 
      newClue ?
        this.setState({
          isGameStarted: true,
          currentClue: newClue
        })
        : AlertIOS.alert('OK Actually finished');  
    })
  }

  _checkInPressed = () => {
    console.log('clueLocation', this.state.currentClue.long, this.state.currentClue.lat);
    this._getLocationAsync();
    let distToClue = Loc.calculateDistance( this.state.userLocation.coords, this.state.currentClue.lat, this.state.currentClue.long );
    distToClue <= this.state.currentClue.radius ?
      clue.setToComplete(this.state.currentClue.id)
      .then(()=>{ 
        let newState = Object.assign({},this.state,{
          cluesCompleted: [
          ...this.state.cluesCompleted,
          this.state.currentClue
          ]
        });
        this.setState(newState);
        this._getNextClue();
      })
      : AlertIOS.alert('Bitch move...', 'Not in correct location!');
  };

  toggleCluesList() {
    this.setState(Object.assign({}, this.state, {
      viewingClues: !this.state.viewingClues
    }))
  }

  render() {
    if (this.state.userLocation === null) {
      return (
        <View style={styles.container} />
      );
    }
    else {
      return (
        <View style={styles.container}>
          <StatusBar hidden />
          <Button
            onPress={this.toggleCluesList}
            title="Completed Clues"
            color="#841584"
          />
          {
              this.state.viewingClues && 
              <FlatList 
                style={styles.listView} 
                data={this.state.cluesCompleted} 
                keyExtractor={item => item.id}
                renderItem={({item}) => <Text>{item.place_name}: {item.description}</Text>} 
              />
          }
          <MapView
            style={styles.mapView}
            provider={'google'}
            region={{
              latitude: this.state.userLocation.coords.latitude,
              longitude: this.state.userLocation.coords.longitude,
              latitudeDelta: 0,//0.0922,
              longitudeDelta: 0.01//0.0421,
            }}
          >
            <MapView.Circle
              radius={20}
              fillColor={'#00F'}
              center={{
                latitude: this.state.userLocation.coords.latitude,
                longitude: this.state.userLocation.coords.longitude
              }}
            />
          </MapView>
          {
            this.state.isGameStarted &&
            <CheckInButton 
              style={styles.checkInButton} 
              checkIn={this._checkInPressed} 
            />
          }
          {
            !this.state.isGameStarted &&
            <StartButton
              style={styles.startButton}
              startGame={this._getNextClue}
            />
          }
          {
            this.state.isGameStarted &&
            <ClueOverlay style={styles.clueOverlay} 
              clue={this.state.currentClue.description} 
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
    // backgroundColor: '#000',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  listView: {
    height: 300,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#d6d7da',
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
