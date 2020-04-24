/**
 * 
 */

var appstatus = [];

function setSpinner( id )
{	
	$( "#" + id ).html( "<img src='resources/spinner_25.gif'></img>" );
}

function initResult( appname )
{
	if ( !( appname in appstatus) )
	{
		appstatus[ appname ] = new Object();
		
		appstatus.query = "https://scriptureappbuilder.azurewebsites.net/api/appbuildertrigger?";
	}
	
	appstatus[ appname ].result =
	{
		success		: false
		, message	: "Waiting for the server..."
		, link		: null
	}
}

function sendRequest()
{
	var		appname	= $( '#AppName' ).val();
	
	if ( appname in appstatus )
	{
		alert( "App Name: " + appname + " is already in process." );
		return;
	}

	var		repourl		= $( '#RepoURL' ).val();
	var		phone		= $( '#PhoneNotify' ).val();
	var		query = "https://scriptureappbuilder.azurewebsites.net/api/appbuildertrigger?";
	
	query = query + "AppName="  + appname	+ '&';
	query = query + "RepoURL="	+ repourl	+ '&';
	query = query + "Phone="	+ phone;
	
	setSpinner( "ShortMessage" );
	addAppRow( appname );
	initResult( appname );
	
	$.ajax
	({
		method			:	"GET"
		,crossDomain	:	true

		,url			:	query
		,success		:	function( result, status, xhr )
		{
			manageResult( result, status );
		}
		,error		:	function( result, status, message )
		{
			manageResult( result, status, message );
		}
		,done		:	function( result, status, xhr )
		{
			manageResult( result );
		}
	});
}

function manageResult( result, status, message )
{
console.log( result );

	if ( result.success )
	{		
		$( "#ShortMessage" ).html( result.message );
		
		appstatus[ result.appname ].result = result;
	}
	else if ( 'error' == status)
	{
		$( "#ShortMessage" ).html( "Error: " + message );
	}
}

function updateResult( inresult, appname )
{
	var appresult = appstatus[ appname ].result;
	
	if ( null != inresult.JobID )		appresult.JobID		= inresult.JobID;
	if ( null != inresult.JobStatus )	appresult.JobStatus	= inresult.JobStatus;
	if ( null != inresult.appname )		appresult.appname	= inresult.appname;
	if ( null != inresult.success )		appresult.success	= inresult.success;
	if ( null != inresult.message )		appresult.message	= inresult.message;
	
	// ===========================================
	// Dan!!!!!! You can back remove the following hardcoded stuff
	// ===========================================
	if ( 'undefined'== typeof appresult.count )
	{
		appresult.count = 0;
	}
	
	appresult.count++;
	
	if ( 3 == appresult.count )
	{
		appresult.JobID = "8e44b4b3-fa1e-44d8-8a8e-5d5f851863b2";
		appresult.JobStatus = "Succeeded";
		appresult.message = "Your app is ready for download.";
		appresult.link = "https://scriptureappstorage.file.core.windows.net/acishare/knulb22-1.0.apk?sv=2019-02-02&ss=f&srt=sco&sp=rl&se=2021-04-22T01:33:35Z&st=2020-04-21T17:33:35Z&spr=https&sig=XGCF6Ix%2BkOuT8d%2B00IJQKYHx8KO%2Fe%2Bdiq2qJDO9TaA8%3D";
	}
	
	return appresult;
}

function showDownloadLink( result )
{
	var rowid = "#" + result.appname + "-app";
	
	$( rowid ).replaceWith( '<i id="' + result.appname + '-download" onclick="javascript:downloadLink( this );" class="delete-row fas fa-cloud-download-alt"></i>' );
}

function downloadLink( element )
{
	const [ appname ] = element.id.split( "-" );
	
	var		result = appstatus[ appname ].result;
	 
	window.location.href = result.link;
}

function showOutputResults( result, status, message, appname )
{ 
	if ( 'undefined' == typeof status )
	{
		message = 'Nothing to report.';
	}
	else
	{	
		status = status.toLowerCase();
	
		if ( 'error' == status )
		{
			message = "<B>" + appname + "</B>: " + message;
		}
	}
	
	$( "#OutputResults" ).html( result.JobStatus + ": " + message );
	
	if ( "Succeeded" == result.JobStatus )
	{
		showDownloadLink( result );
	}
}

function showAppBuildStatus( button )
{
	var		message = "No current action";
	
	const [appname] = button.id.split( "-" );
	
	if ( ! (appname in appstatus ) )
	{
		showOutputResults( null, 'nobuild', appname + ": App is not currently building.", appname );
		return;
	}
	else if ( ! appstatus[ appname ].result.success )
	{
		showOutputResults( null, 'error', appstatus[ appname ].result.message, appname );
		return;
	}
	
	console.log( appstatus[ appname ].result );
	
	setSpinner( "OutputResults" );
	
	var buildstatus = appstatus.query + "JobId=" + appstatus[ appname ].result.JobID;
		
	$.ajax
	({
		method			:	"GET"
		,crossDomain	:	true

		,url			:	buildstatus
//		,url			:	appstatus[ appname ].result.link
		,appname		:	appname
		
		,success		:	function( result, status, xhr )
		{
			result = updateResult( result, this.appname );
			
			console.log( "SUCCESS" );
			console.log( result );
			console.log( status );
			console.log( xhr );
			
			showOutputResults( result, status, result.message, this.appname );
		}
		,error		:	function( result, status, message )
		{
//			console.log( this );
//			console.log( "ERROR" );
//			console.log( result );
//			console.log( status );
//			console.log( xhr );
			
			showOutputResults( result, status, message, this.appname );
		}
	});
	
}

function removeAppRow( element )
{
	const [ appname ] = element.id.split( "-" );
	
	delete appstatus[ appname ];
	
	$( "#OutputResults" ).text( "" );

	var rowid = "#" + appname + "-row";

	$( rowid ).remove();
}

function addAppRow( appname )
{
	var table = $( "#BuildAppTable" );
	
	var rowname		= appname + "-row";
	var rowstatus	= appname + "-app";
	var rowdelete	= appname + "-x";
	
	table.append
	(
		  '<tr id="' + rowname + '">\n'
		+ '	<td class="label">\n'
		+ '		Results for <b>' + appname + '</b>\n'
		+ '	</td>\n'
		+ '	<td>\n'
		+ '		<div style="margin-right:10px;width:230px;" class="tm_fa_button btn btn-xs btn-primary" onclick="javascript:refreshDirectoryFileList()">\n'
		+ '			List Files And Directories\n'
		+ '		</div>\n'
		+ '		<div id="' + rowstatus + '" class="tm_fa_button" '
		+ '					style="width:120px;margin-right:10px;" '
		+ '					onclick="javascript:showAppBuildStatus( this )">\n'
		+ '			Show Status\n'
		+ '		</div>\n'
		+ '		<i id="' + rowdelete
		+'" onclick="javascript:removeAppRow( this )" class="delete-row fas fa-times"></i>'
		+ '	</td>\n'
		+ '</tr>\n'
	);
}


// ------------------------------------------------------
function validateAppName( event )
{
	var key = event.originalEvent.key;
	
	if ( /[a-z0-9]/.test( key ) )	return true;
		
	return false;
}

// ------------------------------------------------------
function validatePhone( event )
{
	var key = event.originalEvent.key;
	
	if ( /[\-\(\)\.0-9]/.test( key ) )	return true;
		
	return false;
}
