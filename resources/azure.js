var account = document.getElementById('account').value;
var sas = document.getElementById('sas').value;
var fileShare = 'acishare';
var currentPath = '';
var fileUri = '';
var currentPath = [];

function checkParameters() {
	account = document.getElementById('account').value;
	sas = document.getElementById('sas').value;
	
	if (account == null || account.length < 1)
	{
		alert('Please enter a valid storage account name!');
		return false;
	}
	if (sas == null || sas.length < 1)
	{
		alert('Please enter a valid SAS Token!');
		return false;
	}
	
	return true;
}

function getFileService() {
	if (!checkParameters())
		return null;
		
		fileUri = 'https://' + account + '.file.core.windows.net';
		var fileService = AzureStorage.File.createFileServiceWithSas(fileUri, sas).withFilter(new AzureStorage.File.ExponentialRetryPolicyFilter());
		return fileService;
}

function refreshFileShareList()
{
	var fileService = getFileService();
	if (!fileService)
		return;
		
		document.getElementById('result').innerHTML = 'Loading...';
		fileService.listSharesSegmented(null, function (error, results) {
			if (error) {
				alert('List file share error, please open browser console to view detailed error');
				console.log(error);
			} else {
				var output = [];
				output.push('<tr>',
					'<th>ShareName</th>',
					'<th>ShareETag</th>',
					'<th>ShareQuota</th>',
					'<th>LastModified</th>',
					'<th>Operations</th>',
					'</tr>');
				if (results.entries.length < 1) {
					output.push('<tr><td>Empty results...</td></tr>');
				}
				for (var i = 0, share; share = results.entries[i]; i++) {
					output.push('<tr>',
						'<td>', share.name, '</td>',
						'<td>', share.etag, '</td>',
						'<td>', share.quota, '</td>',
						'<td>', share.lastModified, '</td>',
						'<td>', '<button class="btn btn-xs btn-danger" onclick="deleteFileShare(\'', share.name ,'\')">Delete</button> ',
						'<button class="btn btn-xs btn-success" onclick="viewFileShare(\'', share.name ,'\')">Select</button>', '</td>',
						'</tr>');
				}
				document.getElementById('result').innerHTML = '<table class="table table-condensed table-bordered">' + output.join('') + '</table>';
			}
		});
}

function deleteFileShare(name) {
	var fileService = getFileService();
	if (!fileService)
		return;
		
		fileService.deleteShareIfExists(name, function(error, result){
			if (error) {
				alert('Delete file share failed, open browser console for more detailed info.');
				console.log(error);
			} else {
				alert('Delete ' + name + ' successfully!');
				refreshFileShareList();
			}
		});
}

function createFileShare() {
	var fileService = getFileService();
	if (!fileService)
		return;
		
		var share = document.getElementById('newfileshare').value;
		if (!AzureStorage.File.Validate.shareNameIsValid(share, function(err, res){})) {
			alert('Invalid share name!');
			return;
		}
		
		fileService.createShareIfNotExists(share, function(error, result){
			if (error) {
				alert('Create file share failed, open browser console for more detailed info.');
				console.log(error);
			} else {
				alert('Create ' + share + ' successfully!');
				refreshFileShareList();
			}
		});
}

function viewFileShare(selectedFileShare) {
	fileShare = selectedFileShare;
	alert('Selected ' + fileShare + ' !');
	currentPath = [];
	refreshDirectoryFileList();
}

function backDirectory() {
	var fileService = getFileService();
	if (!fileService)
		return;
		
		if (fileShare.length < 1) {
			alert('Please select one file share!');
			return;
		}
		
		if (currentPath.length > 0)
			currentPath.pop();
			
			refreshDirectoryFileList();
}

function refreshDirectoryFileList(directory)
{
	var fileService = getFileService();
	if (!fileService)
		return;
		
		if (fileShare.length < 1) {
			alert('Please select one file share!');
			return;
		}
		
		if (typeof directory === 'undefined')
			var directory = '';
			if (directory.length > 0)
				currentPath.push(directory);
				directory = currentPath.join('\\\\');
				
				document.getElementById('directoryFiles').innerHTML = 'Loading...';
				fileService.listFilesAndDirectoriesSegmented(fileShare, directory, null, function (error, results) {
					if (error) {
						alert('List directories and files error, please open browser console to view detailed error');
						console.log(error);
					} else {
						document.getElementById('path').innerHTML = directory;
						
						var outputDirectory = [];
						outputDirectory.push('<tr>',
							'<th align="left">Name</th>',
							'<th align="left">Download</th>',
							'</tr>');
						if (results.entries.directories.length < 1 && results.entries.files.length < 1) {
							outputDirectory.push('<tr><td>Empty results...</td></tr>');
						}
						for (var i = 0, dir; dir = results.entries.directories[i]; i++) {
							outputDirectory.push('<tr>',
								'<td>', dir.name, '</td>',
								'<td>', '<button class="btn btn-xs btn-danger" onclick="deleteDirectory(\'', dir.name ,'\')">Delete</button> ',
								'<button class="btn btn-xs btn-success" onclick="refreshDirectoryFileList(\'', dir.name ,'\')">View</button>', '</td>',
								'</tr>');
						}
						
						var outputFiles = [];
						var currentDir = currentPath.join('\\');
						if (currentPath.length > 0)
							currentDir += '/';
							
							for (var i = 0, file; file = results.entries.files[i]; i++) {
								outputFiles.push('<tr>',
									'<td>', file.name, '</td>',
									'<td>', '<a class="btn btn-xs btn-success" href="', fileUri + '/' + fileShare + '/' + currentDir + file.name + sas, '" download>Download</a>' , '</td>',
									'</tr>');
							}
							document.getElementById('directoryFiles').innerHTML = '<table class="table table-condensed table-bordered">' + outputDirectory.join('') + outputFiles.join('') + '</table>';
					}
				});
}

function deleteDirectory(name) {
	var fileService = getFileService();
	if (!fileService)
		return;
		if (fileShare.length < 1) {
			alert('Please select a file share!');
			return;
		}
		
		fileService.deleteDirectoryIfExists(fileShare, currentPath.join('\\\\') + '\\' + name, function(error, results) {
			if (error) {
				alert('Delete directory failed, open browser console for more detailed info.');
				console.log(error);
			} else {
				alert('Delete ' + name + ' successfully!');
				refreshDirectoryFileList();
			}
		});
}

function deleteFile(file) {
	var fileService = getFileService();
	if (!fileService)
		return;
		
		fileService.deleteFileIfExists(fileShare, currentPath.join('\\\\'), file, function(error, results) {
			if (error) {
				alert('Delete file failed, open browser console for more detailed info.');
				console.log(error);
			} else {
				alert('Delete ' + file + ' successfully!');
				refreshDirectoryFileList();
			}
		});
}

function createDirectory() {
	var fileService = getFileService();
	if (!fileService)
		return;
		
		var directoryName = document.getElementById('newdirectory').value;
		fileService.createDirectoryIfNotExists(fileShare, currentPath.join('\\\\') + '\\' + directoryName, function(error, results) {
			if (error) {
				alert('Create directory failed, open browser console for more detailed info.');
				console.log(error);
			} else {
				alert('Create ' + directoryName + ' successfully!');
				refreshDirectoryFileList();
			}
		});
}

function displayProcess(process) {
	document.getElementById('progress').style.width = process + '%';
	document.getElementById('progress').innerHTML = process + '%';
}

function createFileFromStream(checkMD5) {
	var files = document.getElementById('files').files;
	if (!files.length) {
		alert('Please select a file!');
		return;
	}
	var file = files[0];
	
	var fileService = getFileService();
	if (!fileService)
		return;
		
		var btn = document.getElementById("upload-button");
		btn.disabled = true;
		btn.innerHTML = "Uploading";
		var finishedOrError = false;
		var options = {
			contentSettings: {
				contentType: file.type
			},
			storeFileContentMD5 : checkMD5
		};
		
		var speedSummary = fileService.createFileFromBrowserFile(fileShare, currentPath.join('\\\\'), file.name, file, options, function(error, result, response) {
			finishedOrError = true;
			btn.disabled = false;
			btn.innerHTML = "Upload";
			if (error) {
				alert("Upload failed, open browser console for more detailed info.");
				console.log(error);
				displayProcess(0);
			} else {
				displayProcess(100);
				setTimeout(function() { // Prevent alert from stopping UI progress update
					alert('Upload successfully!');
				}, 1000);
					refreshDirectoryFileList();
			}
		});
			
			speedSummary.on('progress', function () {
				var process = speedSummary.getCompletePercent();
				displayProcess(process);
			});
}
