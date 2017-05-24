import React, { Component } from 'react';
import { Text, StyleSheet, TouchableHighlight, Image } from 'react-native';

class CheckInButton extends Component {
  _onPressButton() {
    console.log('tap!');
  }

  render() {
    return (
      <TouchableHighlight onPress={this.props.checkIn} style={this.props.style} underlayColor={'transparent'}>
        {/*<Text>CHECK</Text>*/}
        <Image source={require('../assets/checkin.png')}
       style={{width: 200, height: 150}} />
      </TouchableHighlight>
    );
  }
}

export default CheckInButton;