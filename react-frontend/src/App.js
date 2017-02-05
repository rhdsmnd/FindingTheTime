import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import moment from 'moment';
import $ from 'jquery';


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

	handleStateChange(newDateStr, newIntervalStr) {
		// validate
		console.log(newDateStr);
		console.log(newIntervalStr);
	}

	render() {
		return (
			<div>
				<AppHeader date={this.state.date} interval={this.state.interval} sessions={this.state.sessions}
							handleStateChange={this.handleStateChange} />

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
			<div className="container">
				<DateInputForm intervalStr={intervalStr} date={this.props.date} handleStateChange={this.props.handleStateChange} />
				<div className="row"><div className="col-lg-12">My summary view.</div></div>
			</div>
		);
	}
}

class DateInputForm extends Component {
	constructor(props) {
		super(props);
		console.log(props);
	}

	render() {
		return (
		  <div className="row">
		   <div className="col-lg-12">
			<div className="input-group">
				Showing sessions for 
				<div className="input-group-btn">
					<button type="button" id="date-interval-display" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{this.props.intervalStr}</button>
					<ul className="dropdown-menu">
						<li><a href="#" onClick={(e) => document.getElementById("date-interval-display").innerHTML = DAY_STR} >{DAY_STR}</a></li>
						<li><a href="#" onClick={(e) => document.getElementById("date-interval-display").innerHTML = WEEK_STR } >{WEEK_STR}</a></li>
						<li><a href="#" onClick={(e) => document.getElementById("date-interval-display").innerHTML = MONTH_STR} >{MONTH_STR}</a></li>
						<li><a href="#" onClick={(e) => document.getElementById("date-interval-display").innerHTML = YEAR_STR} >{YEAR_STR}</a></li>
					</ul>
				</div>
				<input type="text" className="form-control" id="header-datepicker" value={moment(this.props.date.toDateString()).format('L')} />
				<span className="input-group-btn">
					<button className="btn btn-default" type="button" onClick={(() => this.props.handleStateChange(document.getElementById("header-datepicker").value, document.getElementById("date-interval-display").innerHTML) )}>Go!</button>
				</span>
			</div>
		</div>
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
