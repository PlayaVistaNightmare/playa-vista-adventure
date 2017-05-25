import React, { Component } from 'react';
import { Image, Text, StyleSheet, Button, View } from 'react-native';

class StartButton extends Component {

  render() {
    return (
      <View style={this.props.style}>
        <View style={this.props.startstyle}>
            <Image style={{top: 0, width: 300, height: 500 }}source={require('../assets/startpage.png')} />
            {/*<Text style={{'color':'red', 'fontSize':30, 'padding':20, 'marginTop': 0, 'textAlign':'center'}}>
             Welcome to the Playa Vista {"\n \n"} NIGHTMARE SCAVENGER HUNT
            </Text>*/}
           </View>
        <Button
          onPress={this.props.startGame}
          title="START AT YOUR OWN PERIL"
          color="black"
        />
     </View>
    );
  }
}

export default StartButton;