/**
 * Authorization information. This should be obtained through the Google APIs
 * developers console. https://code.google.com/apis/console/
 * Also there is more information about how to get these in the authorization
 * section in the Google JavaScript Client Library.
 * https://code.google.com/p/google-api-javascript-client/wiki/Authentication
 */

var clientId = '657336628940-qfgikt5qv8k8ervasdta1orcdjgp6n5m.apps.googleusercontent.com';
var scopes = 'https://www.googleapis.com/auth/analytics.readonly';
var apiKey = 'AIzaSyBqBRgHijo2L3Ezbwu_DsEVzQRTL5oVpg8';

var iabAccountId = 45967923; // used to generate propertyId
var iabWebPropertyId = 'UA-45967923-1'; // used with accountId to generate profileId
var iabProfileId = '79395509'; // used for querying


/**
 * Callback executed once the Google APIs Javascript client library has loaded.
 * The function name is specified in the onload query parameter of URL to load
 * this library. After 1 millisecond, checkAuth is called.
 */
function handleClientLoad() {
  gapi.client.setApiKey(apiKey);
  window.setTimeout(checkAuth, 1);
}

/**
 * Uses the OAuth2.0 clientId to query the Google Accounts service
 * to see if the user has authorized. Once complete, handleAuthResults is
 * called.
 */
function checkAuth() {
  gapi.auth.authorize({
    client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
}

/**
 * Handler that is called once the script has checked to see if the user has
 * authorized access to their Google Analytics data. If the user has authorized
 * access, the analytics api library is loaded and the handleAuthorized
 * function is executed. If the user has not authorized access to their data,
 * the handleUnauthorized function is executed.
 * @param {Object} authResult The result object returned form the authorization
 *     service that determine whether the user has currently authorized access
 *     to their data. If it exists, the user has authorized access.
 */

 // creates the analytics service object
function handleAuthResult(token) { // important to set token?
  if (token) {
    gapi.client.load('analytics', 'v3', handleAuthorized);
  } else {
    handleUnauthorized();
  }
}

/**
 * Updates the UI once the user has authorized this script to access their
 * data. This changes the visibiilty on some buttons and adds the
 * makeApiCall click handler to the run-demo-button.
 */
function handleAuthorized() {
  var authorizeButton = document.getElementById('authorize-button');
  var runDemoButton = document.getElementById('run-demo-button');

  authorizeButton.style.visibility = 'hidden';
  runDemoButton.style.visibility = '';
  // runDemoButton.onclick = makeApiCall;
  runDemoButton.onclick = iabTest;
  outputToPage('Click the Run Demo button to begin.');
}

function iabTest(){
  queryCoreReportingApi(iabProfileId);
}

/**
 * Updates the UI if a user has not yet authorized this script to access
 * their Google Analytics data. This function changes the visibility of
 * some elements on the screen. It also adds the handleAuthClick
 * click handler to the authorize-button.
 */
function handleUnauthorized() {
  var authorizeButton = document.getElementById('authorize-button');
  var runDemoButton = document.getElementById('run-demo-button');

  runDemoButton.style.visibility = 'hidden';
  authorizeButton.style.visibility = '';
  authorizeButton.onclick = handleAuthClick;
  outputToPage('Please authorize this script to access Google Analytics.');
}

/**
 * Handler for clicks on the authorization button. This uses the OAuth2.0
 * clientId to query the Google Accounts service to see if the user has
 * authorized. Once complete, handleAuthResults is called.
 * @param {Object} The onclick event.
 */
function handleAuthClick(event) {
  gapi.auth.authorize({
    client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
  return false;
}

function auth() {
  var config = {
    'response_type': 'token',
    'approval_prompt': 'auto',
    'client_id': clientId,
    'scope': scopes
  };
  gapi.auth.authorize(config, function(res) {
    console.log('login complete');
    console.log(gapi.auth.getToken());
    console.log(res);
    validate(res.access_token);
  });
}

/**
 * Executes a query to the Management API to retrieve all the users accounts.
 * Once complete, handleAccounts is executed. Note: A user must have gone
 * through the Google APIs authorization routine and the Google Anaytics
 * client library must be loaded before this function is called.
 */
function makeApiCall() {
  outputToPage('Querying Accounts.');
  makeMetadataRequest();
  // gapi.client.analytics.management.accounts.list().execute(handleAccounts);
}

/**
 * Handles the API response for querying the accounts collection. This checks
 * to see if any error occurs as well as checks to make sure the user has
 * accounts. It then retrieve the ID of the first account and then executes
 * queryWebProeprties.
 * @param {Object} The response object with data from the
 *     accounts collection.
 */

function handleAccounts(response) {
  if (!response.code) {
    if (response && response.items && response.items.length) {
      var firstAccountId = response.items[0].id;
      queryWebproperties(firstAccountId);
    } else {
      updatePage('No accounts found for this user.')
    }
  } else {
    updatePage('There was an error querying accounts: ' + response.message);
  }
}

/**
 * Executes a query to the Management API to retrieve all the users
 * webproperties for the provided accountId. Once complete,
 * handleWebproperties is executed.
 * @param {String} The ID of the account from which to retrieve
 *     webproperties.
 */
function queryWebproperties(accountId) {
  updatePage('Querying Webproperties.');
  gapi.client.analytics.management.webproperties.list({
      'accountId': accountId
  }).execute(handleWebproperties);
}

/**
 * Handles the API response for querying the webproperties collection. This
 * checks to see if any error occurs as well as checks to make sure the user
 * has webproperties. It then retrieve the ID of both the account and the
 * first webproperty, then executes queryProfiles.
 * @param {Object} response The response object with data from the
 *     webproperties collection.
 */
function handleWebproperties(response) {
  if (!response.code) {
    if (response && response.items && response.items.length) {
      var firstAccountId = response.items[0].accountId;
      var firstWebpropertyId = response.items[0].id;
      queryProfiles(firstAccountId, firstWebpropertyId);
    } else {
      updatePage('No webproperties found for this user.')
    }
  } else {
    updatePage('There was an error querying webproperties: ' +
        response.message);
  }
}


/**
 * Executes a query to the Management API to retrieve all the users
 * profiles for the provided accountId and webPropertyId. Once complete,
 * handleProfiles is executed.
 * @param {String} accountId The ID of the account from which to retrieve
 *     profiles.
 * @param {String} webpropertyId The ID of the webproperty from which to
 *     retrieve profiles.
 */
function queryProfiles(accountId, webpropertyId) {
  updatePage('Querying Profiles.');
  gapi.client.analytics.management.profiles.list({
    'accountId': accountId,
    'webPropertyId': webpropertyId // set as inlineAB?
  }).execute(handleProfiles);
}

/**
 * Handles the API response for querying the profiles collection. This
 * checks to see if any error occurs as well as checks to make sure the user
 * has profiles. It then retrieve the ID of the first profile and
 * finally executes queryCoreReportingApi.
 * @param {Object} response The response object with data from the
 *     profiles collection.
 */
function handleProfiles(response) {
  if (!response.code) {
    if (response && response.items && response.items.length) {
      var firstProfileId = response.items[0].id;
      queryCoreReportingApi(firstProfileId);
    } else {
      updatePage('No profiles found for this user.')
    }
  } else {
    updatePage('There was an error querying profiles: ' + response.message);
  }
}


/**
 * Execute a query to the Core Reporting API to retrieve the top 25
 * organic search terms by visits for the profile specified by profileId.
 * Once complete, handleCoreReportingResults is executed.
 * @param {String} profileId The profileId specifying which profile to query.
 */
function queryCoreReportingApi(profileId) {
  updatePage('Querying Core Reporting API.');
  gapi.client.analytics.data.ga.get({
    'ids': 'ga:' + profileId,
    'start-date': lastNDays(14),
    'end-date': lastNDays(0),
    'metrics': 'ga:visits',
    'dimensions': 'ga:eventCategory, ga:eventAction, ga:eventLabel'
    // 'sort': '-ga:visits,ga:source',
    // 'filters': 'ga:medium==organic',
    // 'max-results': 25
  }).execute(handleCoreReportingResults);
}




/**
 * Handles the API reponse for querying the Core Reporting API. This first
 * checks if any errors occured and prints the error messages to the screen.
 * If sucessful, the profile name, headers, result table are printed for the
 * user.
 * @param {Object} response The reponse returned from the Core Reporting API.
 */
function handleCoreReportingResults(response) {
  if (!response.code) {
    console.log(response);
    if (response.rows && response.rows.length) {
      var output = [];

      // Profile Name.
      output.push('Profile Name: ', response.profileInfo.profileName, '<br>');

      var table = ['<table>'];

      // Put headers in table.
      table.push('<tr>');
      for (var i = 0, header; header = response.columnHeaders[i]; ++i) {
        table.push('<th>', header.name, '</th>');
      }
      table.push('</tr>');

      // Put cells in table.
      for (var i = 0, row; row = response.rows[i]; ++i) {
        table.push('<tr><td>', row.join('</td><td>'), '</td></tr>');
      }
      table.push('</table>');

      output.push(table.join(''));
      outputToPage(output.join(''));
    } else {
      outputToPage('No results found.');
    }
  } else {
    updatePage('There was an error querying core reporting API: ' +
        response.message);
  }
}


/**
 * Utility method to update the output section of the HTML page. Used
 * to output messages to the user. This overwrites any existing content
 * in the output area.
 * @param {String} output The HTML string to output.
 */
function outputToPage(output) {
  document.getElementById('output').innerHTML = output;
}


/**
 * Utility method to update the output section of the HTML page. Used
 * to output messages to the user. This appends content to any existing
 * content in the output area.
 * @param {String} output The HTML string to output.
 */
function updatePage(output) {
  document.getElementById('output').innerHTML += '<br>' + output;
}


/**
 * Utility method to return the lastNdays from today in the format yyyy-MM-dd.
 * @param {Number} n The number of days in the past from tpday that we should
 *     return a date. Value of 0 returns today.
 */
function lastNDays(n) {
  var today = new Date();
  var before = new Date();
  before.setDate(today.getDate() - n);

  var year = before.getFullYear();

  var month = before.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }

  var day = before.getDate();
  if (day < 10) {
    day = '0' + day;
  }

  return [year, month, day].join('-');
}


function makeMetadataRequest() {
  var request = gapi.client.analytics.metadata.columns.list({
      'reportType': 'ga'
  });
  request.execute(renderMetadataReport);
}


/**
 * 2. Print out the Columns data
 * The components of the result can be printed out as follows:
 */

function renderMetadataReport(results) {
  console.log(results);
  var reportHtml = [];
  reportHtml.push(
      getReportInfo(results),
      getAttributes(results),
      getColumns(results));

  // Renders the results to a DIV element
  document.getElementById('DIV_ID').innerHTML = reportHtml.join('');
}


function getReportInfo(results) {
  var html = [];
  if (results) {
    html.push('<h2>Report Info</h2>');
    html.push('<pre>Kind: ', results.kind, '</pre>');
    html.push('<pre>Etag: ', results.etag, '</pre>');
    html.push('<pre>Total Results: ', results.totalResults, '</pre>');
  }
  return html.join('');
}


function getAttributes(results) {
  var html = [];
  if (results) {
    html.push('<h2>Attribute Names</h2><ul>');
    var attributes = results.attributeNames;

    for (var i = 0, attribute; attribute = attributes[i]; i++) {
      html.push('<li>', attribute, '</li>');
    }
    html.push('</ul>');
  }
  return html.join('');
}

function  getColumns(results) {
  var html = [];
  if (results) {
    var columns = results.items;
    html.push('<h2>Columns</h2>');

    for (var i = 0, column; column = columns[i]; i++) {
      html.push('<h3>', column.id, '</h3>');
      var attributes = column.attributes;
      for (attribute in attributes) {
        html.push('<pre><strong>', attribute, '</strong> : ',
                  attributes[attribute], '</pre>');
      }
    }
  }
  return html.join('');
}


function validate(token) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET','https://www.googleapis.com/oauth2/v1/tokeninfo?access_token='+token, true);
  xhr.onreadystatechange = function(e){
    if(xhr.readyState === 4 && xhr.status === 200){
      console.log(e);
      if(e.audience === clientId) console.log('ALMOST THERE!');
      console.log('success second!');
    } else if(xhr.status === 400){
      console.log('server error');
    } else {
      console.log('random error!');
    }
  }
  xhr.send(null);
}