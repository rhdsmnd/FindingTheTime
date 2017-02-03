import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';


var ip = '127.0.0.1';

class App extends Component {
  
	constructor() {
		super();
		this.state = {
			interval: 'd',
			date: new Date(),
			sessions: []
		};
	}

	componentWillMount() {
		var req = new XMLHttpRequest();

		var url = "query?interval=" + this.state.interval + "&"
					+ "date=" + this.state.date;

		req.open("GET", "http://localhost/" + url);

		req.addEventListener("load", function(e) {
			var resp = e.target.response;

			this.setState({
				sessions: resp.sessions
			});
		});
	}



	render() {
		return (
			<div>
				<AppHeader date={this.state.date} interval={this.state.interval} sessions={this.state.sessions} />

				<hr />

				<AppBody date={this.state.date} interval={this.state.interval} sessions={this.state.sessions} />
			</div>	
		);
	}

	/**
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }*/
}

	/**
class DateSelector extends Component {
	constructor(props) {

	}
}
*/


class AppHeader extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		var intervalStr;
		if (this.props.interval === 'd') {
			intervalStr = "";
		} else if (this.props.interval === 'w') {
			intervalStr = "the week containing ";
		} else if (this.props.interval === 'm') {
			intervalStr = "the month containing ";
		} else if (this.props.interval === 'y') {
			intervalStr = "the year containing";
		}


		return (
			<div>
				<div>Showing sessions for {intervalStr}{this.props.date.toDateString()}</div>
				<div>My summary view.</div>
			</div>
		);
	}

}
/**
class DataSummary extends Component {

	constructor(props) {

	}
}
*/

class AppBody extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>placeholder body text</div>
		);
	}
}
	/**
class StatsTable extends Component {

	constructor(props) {

	}
}

class Timeline extends Component {

	constructor(props) {

	}
}

class PieChart extends Component {

	constructor(props) {

	}
}
*/

export default App;
