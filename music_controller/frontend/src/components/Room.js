import React, { Component } from "react";
import { Grid, Button, Typography } from "@material-ui/core";
import CreateRoomPage from "./CreateRoomPage";
import MusicPlayer from "./music_player";

export default class Room extends Component {
  constructor(props) {
    super(props);
    this.state = {
      votesToSkip: 2,
      guestCanPause: false,
      isHost: false,
      showSettings: false,
      spotifyAuthenticated: false,
      song: {}
    };
    this.roomCode = this.props.match.params.roomCode;
    this.leaveButtonPressed = this.leaveButtonPressed.bind(this);
    this.updateShowSettings = this.updateShowSettings.bind(this);
    this.renderSettingsButton = this.renderSettingsButton.bind(this);
    this.renderSettings = this.renderSettings.bind(this);
    this.getRoomDetails = this.getRoomDetails.bind(this);
    this.authenticateSpotify = this.authenticateSpotify.bind(this);
    this.getCurrentSong = this.getCurrentSong.bind(this);
    this.getRoomDetails();
  }

  //did mount and will unmount help us continue to pull spotify information each second
  componentDidMount() { this.interval = setInterval(this.getCurrentSong, 1000);}
  componentWillUnmount() { clearInterval(this.interval); }

  //function to fetch the states/values of a room... reused in multiple other functions to grab room details
  getRoomDetails() {
    return fetch("/api/get-room" + "?code=" + this.roomCode)
      .then((response) => {
        if (!response.ok) {
          this.props.leaveRoomCallback();
          this.props.history.push("/");
        }
        return response.json();
      })
      .then((data) => {
        this.setState({
          votesToSkip: data.votes_to_skip,
          guestCanPause: data.guest_can_pause,
          isHost: data.is_host,
        });
        if(this.state.isHost) {
        this.authenticateSpotify();
        }
      });
  }

  //onclick function to ask the user to authenticate with spotify if they are the host of the room
  authenticateSpotify() {
    fetch("/spotify/is-authenticated")
      .then((response) => response.json())
      .then((data) => {
        this.setState({ spotifyAuthenticated: data.status });
        console.log(data.status);
        if (!data.status) {
          fetch("/spotify/get-auth-url")
            .then((response) => response.json())
            .then((data) => {
              window.location.replace(data.url);
            });
        }
      });
  }

  //function to fetch the current song playing on the host's spotify account
  getCurrentSong() {
    fetch('/spotify/current-song')
    .then((response) => {
    if(!response.ok) {
      return {};
    } else {
      return response.json();
    }
    })
    .then((data) => this.setState({song: data}));
    console.log(data);
  }

  //onclick function to set state and redirect when the leave room button is pressed
  leaveButtonPressed() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/api/leave-room", requestOptions).then((_response) => {
      this.props.leaveRoomCallback();
      this.props.history.push("/");
    });
  }

  //onclick function to change the state of showSettings for toggle purposes between "settings" and "update room"
  updateShowSettings(value) {
    this.setState({
      showSettings: value,
    });
  }

  //render function for users when creating a room or editing the room settings
  renderSettings() {
    return(
    <Grid container spacing={1}>
      <Grid item xs={12} align ="center">
        <CreateRoomPage 
          update={true} 
          votesToSkip={this.state.votesToSkip} 
          guestCanPause={this.state.guestCanPause} 
          roomCode={this.roomCode}
          updateCallBack={this.getRoomDetails}/>
      </Grid>
      <Grid item xs={12} align ="center">
        <Button variant="contained" color="secondary" onClick={() => this.updateShowSettings(false)}>
          Close
        </Button>
      </Grid>
    </Grid>
    );
  }

  //toggle between settings and update room
  renderSettingsButton() {
    return(
        <Grid item xs={12} align="center">
          <Button variant="contained" color="primary" onClick={()=> this.updateShowSettings(true)}>
            Settings
          </Button>
        </Grid>
    );
  }

  //render function for the room page
  render() {
    if(this.state.showSettings) {
      return this.renderSettings();
    }
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <Typography variant="h4" component="h4">
            Code: {this.roomCode}
          </Typography>
        </Grid>
        <MusicPlayer {...this.state.song}/>
        {this.state.isHost ? this.renderSettingsButton() : null}
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={this.leaveButtonPressed}
          >
            Leave Room
          </Button>
        </Grid>
      </Grid>
    );
  }
}