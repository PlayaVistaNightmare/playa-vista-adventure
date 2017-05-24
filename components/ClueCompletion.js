import React, { Component } from 'react';
import { Text, StyleSheet } from 'react-native';

class ClueCompletion extends Component {
  render() {
    return (
      <Text style={this.props.style}>
        {this.props.cluesCompleted.length} / {this.props.allLength}
      </Text>
    );
  }
}

export default ClueCompletion;
