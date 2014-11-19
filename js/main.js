jQuery.fn.updateWithText = function(text, speed)
{
	var dummy = $('<div/>').html(text);

	if ($(this).html() != dummy.html())
	{
		$(this).fadeOut(speed/2, function() {
			$(this).html(text);
			$(this).fadeIn(speed/2, function() {
				//done
			});		
		});
	}
} 

jQuery.fn.outerHTML = function(s) {
    return s
        ? this.before(s).remove()
        : jQuery("<p>").append(this.eq(0).clone()).html();
};

function roundVal(temp)
{
	return Math.round(temp * 10) / 10;
}

function kmh2beaufort(kmh)
{
	var speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 1000];
	for (var beaufort in speeds) {
		var speed = speeds[beaufort];
		if (speed > kmh) {
			return beaufort;
		}
	}
	return 12;
}

jQuery(document).ready(function($) {

	var news = [];
	var newsIndex = 0;

	var eventList = [];

	var lastCompliment;
	var compliment;
	
	var shootingStarObj = new ShootingStar( "body" );
        shootingStarObj.launch(10);

    // multi-langugage support according to browser-lang
    var lang = window.navigator.language;
    switch (lang)
    {
        case 'de':
            var days = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
            var months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
            var dayAbbr = ['So','Mo','Di','Mi','Do','Fr','Sa'];
            var tomorrow = 'morgen';
            var in_days = 'Tage';
            break;
        case 'nl':
            var days = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
            var months = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
            var dayAbbr = ['zo','ma','di','wo','do','vr','za'];
            var tomorrow = 'morgen';
            var in_days = 'dagen';
            break;
        default:
            var days = ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag'];
            var months = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
            var dayAbbr = ['Sön','Mån','Tis','Ons','Tor','Fre','Lör'];
            var tomorrow = 'Imorgon';
            var in_days = 'dagar';
    }
/*
	//connect do Xbee monitor
	var socket = io.connect('http://rpi-development.local:8080');
	socket.on('dishwasher', function (dishwasherReady) {
		if (dishwasherReady) {
			$('.dishwasher').fadeIn(2000);
			$('.lower-third').fadeOut(2000);
		} else {
			$('.dishwasher').fadeOut(2000);
			$('.lower-third').fadeIn(2000);		
		}
	});
*/

	var weatherParams = {
		'q':'Fjälkinge, Sweden',
		'units':'metric',
		'lang':lang
	};

	(function checkVersion()
	{
		$.getJSON('githash.php', {}, function(json, textStatus) {
			if (json) {
				if (json.gitHash != gitHash) {
					window.location.reload();
					window.location.href=window.location.href;
				}
			}
		});
		setTimeout(function() {
		//	checkVersion();
		}, 3000);
	})();

	(function updateTime()
	{
		var now = new Date();

		var day = now.getDay();
		var date = now.getDate();
		var month = now.getMonth();
		var year = now.getFullYear();

		var date = days[day] + ', ' + date+' ' + months[month] + ' ' + year;


		$('.date').html(date);
		$('.time').html(now.toTimeString().substring(0,5) + '<span class="sec">'+now.toTimeString().substring(6,8)+'</span>');

		setTimeout(function() {
			updateTime();
		}, 1000);
	})();

	(function updateCalendarData()
	{
		new ical_parser("calendar.php", function(cal){
        	events = cal.getEvents();
        	eventList = [];

        	for (var i in events) {
			//console.log(events[i]);
        		var e = events[i];
        		
			if(e.hasOwnProperty('RRULE'))//e.RRULE != '')
			{
			   for (var key in e) {
        			var value = e[key];
					var seperator = key.search(';');
					if (seperator >= 0) {
						var mainKey = key.substring(0,seperator);
						var subKey = key.substring(seperator+1);

						var dt;
						var dt2 = new Date();
						if (e.RRULE.substring(5,11) === 'YEARLY'){
						
				          		if (subKey == 'VALUE=DATE') {
					     			//date
								dt = new Date(dt2.getFullYear(), value.substring(4,6) - 1, value.substring(6,8));
							} else {
								//time
								dt = new Date(dt2.getFullYear(), value.substring(4,6) - 1, value.substring(6,8), value.substring(9,11), value.substring(11,13), value.substring(13,15));
							}
						}
						else if(e.RRULE.substring(5,11) === 'MONTHL'){
							//console.log(events[i]);
						       if (subKey == 'VALUE=DATE') {
                                                                //date
                                                                dt = new Date(dt2.getFullYear(), dt2.getMonth(), value.substring(6,8));
                                                        } else {
                                                                //time
                                                                dt = new Date(dt2.getFullYear(), dt2.getMonth(), value.substring(6,8), value.substring(9,11), value.substring(11,13), value.substring(13,15));
                                                        }
                                                }
						else{
							                                                
                                                        if (subKey == 'VALUE=DATE') {
                                                                //date
                                                                dt = new Date(value.substring(0,4), value.substring(4,6) - 1, value.substring(6,8));
                                                        } else {
                                                                //time
                                                                dt = new Date(value.substring(0,4), value.substring(4,6) - 1, value.substring(6,8), value.substring(9,11), value.substring(11,13), value.substring(13,15));
                                                        }
                                                
						}
						if (mainKey == 'DTSTART') e.start_date = dt; 
						if (mainKey == 'DTEND') e.endDate = dt; 
					}
        		} 
			}

        		var now = new Date();
        		var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        		var days = moment(e.start_date).diff(moment(today).format('L'), 'days');
			//console.log(e.RRULE);
			//console.log(moment(e.start_date).format('L'));
			//console.log(moment(today).format('L'));

        		//only add fututre events
        		if (days >= 0 && days != -0) {
				//console.log(days);
	        		eventList.push({'description':e.SUMMARY,'days':days});
        		}
        	};
        	eventList.sort(function(a,b){return a.days-b.days});

        	setTimeout(function() {
        		updateCalendarData();
        	}, 60000);
    	});
	})();

	(function updateCalendar()
	{
		table = $('<table/>').addClass('xsmall').addClass('calendar-table');
		opacity = 1;


		for (var i in eventList) {
			var e = eventList[i];
			var days = e.days;

			var daysString = (days == 1) ? tomorrow :  days + ' ' + in_days;
    		if (days == 0) {
    			daysString = 'Idag';
    		}

			var row = $('<tr/>').css('opacity',opacity);
			row.append($('<td/>').html(e.description).addClass('description'));
			row.append($('<td/>').html(daysString).addClass('days dimmed'));
			table.append(row);

			opacity -= 1 / eventList.length;
		}

		$('.calendar').updateWithText(table,1000);

		setTimeout(function() {
        	updateCalendar();
        }, 1000);
	})();

	(function updateCompliment()
	{

		var compliments = [
                        'Hi, sexy!',
                        'Hello, beauty!',
                        'May the force be with you',
                        'Bästa familjen',
                        'Fia är en fis!',
                        'Sötnos!',
                        'Wow, you look hot!',
                        'Looking good today!',
                        'You look nice!',
                        'Enjoy your day!'
		];

		while (compliment == lastCompliment) {
			compliment = Math.floor(Math.random()*compliments.length);
		}

		$('.compliment').updateWithText(compliments[compliment], 4000);

		lastCompliment = compliment;

		setTimeout(function() {
			updateCompliment(true);
		}, 30000);

	})();

	(function updateCurrentWeather()
	{
		var iconTable = {
			'01d':'wi-day-sunny',
			'02d':'wi-day-cloudy',
			'03d':'wi-cloudy',
			'04d':'wi-cloudy-windy',
			'09d':'wi-showers',
			'10d':'wi-rain',
			'11d':'wi-thunderstorm',
			'13d':'wi-snow',
			'50d':'wi-fog',
			'01n':'wi-night-clear',
			'02n':'wi-night-cloudy',
			'03n':'wi-night-cloudy',
			'04n':'wi-night-cloudy',
			'09n':'wi-night-showers',
			'10n':'wi-night-rain',
			'11n':'wi-night-thunderstorm',
			'13n':'wi-night-snow',
			'50n':'wi-night-alt-cloudy-windy'		
		}


		$.getJSON('http://api.openweathermap.org/data/2.5/weather', weatherParams, function(json, textStatus) {

			var temp = roundVal(json.main.temp);
			var temp_min = roundVal(json.main.temp_min);
			var temp_max = roundVal(json.main.temp_max);

			var wind = roundVal(json.wind.speed);

			var iconClass = iconTable[json.weather[0].icon];
			var icon = $('<span/>').addClass('icon').addClass('dimmed').addClass('wi').addClass(iconClass);
			$('.temp').updateWithText(icon.outerHTML()+temp+'&deg;', 1000);

			// var forecast = 'Min: '+temp_min+'&deg;, Max: '+temp_max+'&deg;';
			// $('.forecast').updateWithText(forecast, 1000);

			var now = new Date();
			var sunrise = new Date(json.sys.sunrise*1000).toTimeString().substring(0,5);
			var sunset = new Date(json.sys.sunset*1000).toTimeString().substring(0,5);

			var windString = '<span class="wi wi-strong-wind xdimmed"></span> ' + kmh2beaufort(wind) ;
			var sunString = '<span class="wi wi-sunrise xdimmed"></span> ' + sunrise;
			if (json.sys.sunrise*1000 < now && json.sys.sunset*1000 > now) {
				sunString = '<span class="wi wi-sunset xdimmed"></span> ' + sunset;
			}

			$('.windsun').updateWithText(windString+' '+sunString, 1000);
		});

		setTimeout(function() {
			updateCurrentWeather();
		}, 60000);
	})();

	(function updateWeatherForecast()
	{		/*
		 	var result;
			var downpour = new XMLHttpRequest();
			var  parseXML = function(xmlStr) {
                                return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
                        };		

			downpour.onload = function(){
				result = parseXML(this.responseText);
				var hej = xml2json(result);
		//	console.log(hej);
			}
			downpour.open('GET', 'downpour.php', true);

			downpour.send();
*/
			

			//var test  = parseXml(result);

			//console.log(test);		

			$.getJSON('http://api.openweathermap.org/data/2.5/forecast', weatherParams, function(json, textStatus) {
			var forecastData = {};

/*_______________________________
                       var result;
			var hej;

                        var downpour = new XMLHttpRequest();
                        var  parseXML = function(xmlStr) {
                                return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
                        };

                        downpour.onload = function(){
                               var result = parseXML(this.responseText);
                               hej = xml2json(result);
			 for (var i in hej.responseData){ 
                        console.log(i);
		                   }
	
                     console.log(hej.result);
                        }
                        downpour.open('GET', 'downpour.php', true);
                        downpour.send();
/*---------------------------------------------------------*/
			for (var i in json.list) {

				var forecast = json.list[i];
			//	var hmm = hej.list[i];
				var dateKey  = forecast.dt_txt.substring(0, 10);
//console.log(forecast.dt_txt.substring(0, 10));
//console.log(forecast);
//console.log(hej.child[i]);
				if (forecastData[dateKey] == undefined) {
					forecastData[dateKey] = {
						'timestamp':forecast.dt * 1000,
						'temp_min':forecast.main.temp,
						'temp_max':forecast.main.temp
					};
				} else {
					forecastData[dateKey]['temp_min'] = (forecast.main.temp < forecastData[dateKey]['temp_min']) ? forecast.main.temp : forecastData[dateKey]['temp_min'];
					forecastData[dateKey]['temp_max'] = (forecast.main.temp > forecastData[dateKey]['temp_max']) ? forecast.main.temp : forecastData[dateKey]['temp_max']; 
				}

			}


			var forecastTable = $('<table />').addClass('forecast-table');
			var opacity = 1;
			for (var i in forecastData) {
				var forecast = forecastData[i];
				var dt = new Date(forecast.timestamp);
				var row = $('<tr />').css('opacity', opacity);

				row.append($('<td/>').addClass('day').html(dayAbbr[dt.getDay()]));
				row.append($('<td/>').addClass('temp-max').html(roundVal(forecast.temp_max)));
				row.append($('<td/>').addClass('temp-min').html(roundVal(forecast.temp_min)));
				row.append($('<td/>').addClass('downpour').html(Math.floor((Math.random() * 10))));

				forecastTable.append(row);
				opacity -= 0.155;
			}


			$('.forecast').updateWithText(forecastTable, 1000);
		});

		setTimeout(function() {
			updateWeatherForecast();
		}, 60000);
	})();

	(function fetchNews() {
		$.feedToJson({
			feed:'http://www.idg.se/rss/nyheter',
			//feed:'http://www.nu.nl/feeds/rss/achterklap.rss',
			//feed:'http://www.nu.nl/feeds/rss/opmerkelijk.rss',
			success: function(data){
				news = [];
				for (var i in data.item) {
					var item = data.item[i];
					news.push(item.title);
				}
			}
		});
		setTimeout(function() {
			fetchNews();
		}, 60000);
	})();

	(function showNews() {
		var newsItem = news[newsIndex];
		$('.news').updateWithText(newsItem,2000);

		newsIndex--;
		if (newsIndex < 0) newsIndex = news.length - 1;
		setTimeout(function() {
			showNews();
		}, 5500);
	})();

});
