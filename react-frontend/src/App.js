import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';


var ip = '127.0.0.1';

const DAY_STR = "the day of";
const WEEK_STR = "the week containing";
const MONTH_STR = "the month containing";
const YEAR_STR = "the year containing";

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

	handleDateChange(newObj) {
		// validate

		
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
			intervalStr = DAY_STR;
		} else if (this.props.interval === 'w') {
			intervalStr = WEEK_STR;
		} else if (this.props.interval === 'm') {
			intervalStr = MONTH_STR;
		} else if (this.props.interval === 'y') {
			intervalStr = YEAR_STR;
		}

		return (
			<div>
				<div>Showing sessions for <ButtonDropdown intervalStr={intervalStr} /> <input type="text" id="header-datepicker" /></div>
				<div>My summary view.</div>
			</div>
		);
	}
}

class ButtonDropdown extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="btn-group">
				<button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-expanded="false">{this.props.intervalStr}</button>
				<ul className="dropdown-menu">
					<li><a href="#">{DAY_STR}</a></li>
					<li><a href="#">{WEEK_STR}</a></li>
					<li><a href="#">{MONTH_STR}</a></li>
					<li><a href="#">{YEAR_STR}</a></li>
				</ul>
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
