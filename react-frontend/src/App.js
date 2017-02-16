import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import moment from 'moment';
import Chart from 'chart.js';

import $ from 'jquery';


const ip = '127.0.0.1';

const DAY_STR = "the day of";
const WEEK_STR = "the week containing";
const MONTH_STR = "the month containing";
const YEAR_STR = "the year containing";

class App extends Component {
  
	constructor() {
		super();
		this.state = {
			interval: 'd',
			date: moment(),
			sessions: []
		};
	}

	componentWillMount() {
		App.setNewInterval(this.state.date, this.state.interval);
	}

	handleStateChange(newDateStr, newIntervalStr) {
		// validate

		let newDate = moment(newDateStr, 'MM-DD-YYYY', true);

		let today = moment();
		let tomorrow = moment({
			y: today.year(),
			M: today.month(),
			d: today.date()
		}).add(1, 'day');

		console.log(newDate);
		console.log(tomorrow);
		if (newDate.format() == 'Invalid date' || newDate.isAfter(tomorrow)) {
			console.log("Invalid date string.");
			return;
		}

		console.log('hello');

		//TODO: CHANGE newIntervalStr TO lengthStr -- interval should comprise a date AND a length
		let newInterval;
		if (newIntervalStr === DAY_STR) {
			newInterval = 'd';
		} else if (newIntervalStr === WEEK_STR) {
			newInterval = 'w';
		} else if (newIntervalStr == MONTH_STR) {
			newInterval = 'm';
		} else if (newIntervalStr == YEAR_STR) {
			newInterval = 'y';
		} else {
			console.log('Error: cannot parse interval in handleStateChange.');
			return;
		}

		App.setNewInterval(newDate, newInterval);

	}

	static setNewInterval(dateObj, intervalChar) {

        var req = new XMLHttpRequest();

        var url = "query?interval=" + intervalChar + "&"
            + "date=" + dateObj.format('MM-DD-YYYY');

        console.log(url);

        return;

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
			<div className="container">
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
			<div>
				<DateInputForm intervalStr={intervalStr} date={this.props.date} handleStateChange={this.props.handleStateChange} />
				<SummaryView sessions={this.props.sessions} interval={this.props.interval} date={this.props.date} />
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
				<input type="text" className="form-control" id="header-datepicker" value={this.props.date.format('MM-DD-YYYY')} />
				<span className="input-group-btn">
					<button className="btn btn-default" type="button" onClick={(() => this.props.handleStateChange(document.getElementById("header-datepicker").value, document.getElementById("date-interval-display").innerHTML) )}>Go!</button>
				</span>
			</div>
		  </div>
	    </div>
		);
	}
}

class SummaryView extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="row">
				<Timeline sessions={this.props.sessions} interval={this.props.interval} date={this.props.date} />
		 		<PieChart sessions={this.props.sessions} interval={this.props.interval} date={this.props.date} />
			</div>
		);
	}
}

class Timeline extends Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		var ctx = document.getElementById("summary-timeline");
		console.log(ctx);
		var myChart = new Chart(ctx, {
		    type: 'horizontalBar',
		    data: {
		        datasets: [{
		            label: '# of Votes',
		            data: [12],
		            backgroundColor: [
		                'rgba(255, 99, 132, 0.2)'
		            ],
		            borderColor: [
		                'rgba(255,99,132,1)'
		            ],
		            borderWidth: 1
		        }, {
		        	label: 'asdfasdf',
		        	data: [9],
		        	backgroundColor: [
		        		'rgba(54, 162, 235, 0.2)'
		        	],
		        	borderColor: [
		        		'rgba(54, 162, 235, 1)'
		        	],
		        	borderWidth: 1
		        }]
		    },
		    options: {
		        scales: {
		            yAxes: [{
		                ticks: {
		                    beginAtZero:true
		                },
		                stacked: true
		            }],
		            xAxes: [{
		            	stacked: true
		            }]
		        },
		        maintainAspectRatio: false
		    }
		});
	}

	render() {
		return (
			<div className="col-lg-6" ><canvas id="summary-timeline"></canvas> </div>
		);
	}
}

class PieChart extends Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		var ctx = document.getElementById("summary-pie-chart");
		console.log(ctx);
		var myChart = new Chart(ctx, {
		    type: 'doughnut',
		    data: {
		    	labels: ["asdf", "fdsa"],
		        datasets: [{
		            label: '# of Votes',
		            data: [12, 9],
		            backgroundColor: [
		        		'rgba(54, 162, 235, 0.2)',
		                'rgba(255, 99, 132, 0.2)'
		            ],
		            borderColor: [
		        		'rgba(54, 162, 235, 1)',
		                'rgba(255,99,132,1)'
		            ],
		            borderWidth: 1
		        }]
		    }
		});
	}

	render() {
		return (
			<div className="col-lg-6"><canvas height="75" id="summary-pie-chart"></canvas></div>
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
			<table className="table table-bordered">
				<TableHeader />
				<TableBody sessions={this.props.sessions} />
			</table>
		);
	}
}

class TableHeader extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<thead>
				<tr>
					<th>Header 1</th>
					<th>Header 2</th>
					<th>Header 3</th>
				</tr>
			</thead>
		);
	}
}

class TableBody extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<tbody>
				<tr>
					<td>a</td>
					<td>b</td>
					<td>c</td>
				</tr>
				<tr>
					<td>d</td>
					<td>e</td>
					<td>f</td>
				</tr>
			</tbody>
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


/**

, "Blue", "Yellow", "Green", "Purple", "Orange"

,
'rgba(54, 162, 235, 0.2)',
'rgba(255, 206, 86, 0.2)',
'rgba(75, 192, 192, 0.2)',
'rgba(153, 102, 255, 0.2)',
'rgba(255, 159, 64, 0.2)'

'rgba(54, 162, 235, 1)',
'rgba(255, 206, 86, 1)',
'rgba(75, 192, 192, 1)',
'rgba(153, 102, 255, 1)',
'rgba(255, 159, 64, 1)'

*/