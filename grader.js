#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = ""; // no default value
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};
var checkUrlFormat = function(url) {
    var re = /^(http|https):\/\//i;
    if(!url.match(re)) {
	console.log("%s is not url format.use 'http|https://'  Exiting.", url);
	process.exit(1);
	}
    return url;

};

var HtmlFile = function(htmlfile) {
    return fs.readFileSync(htmlfile);
};

var HtmlUrl = function(url, callback) {
//console.log("getHtmlUrl" + url);
   rest.get(url).on('complete', function(data,response){
       if(response.statusCode == 200){
	callback(data);
	}
	else
	{
	console.log("can't get "+ url );
	console.log("response code: " + response.statusCode);
	}
    });
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(htmlfile, url , checksfile) {

    if(htmlfile !== null && htmlfile !== '')
    {
	console.log("Check "+ htmlfile);
	printResult( checkTags( HtmlFile(htmlfile),checksfile));
    }
    if(url !== null && url !== '')
    {
	console.log(" Check Url: " + url);
	HtmlUrl(url, function(returnVal){
	printResult( checkTags(returnVal, checksfile));
	});

    }
};

var printResult = function(checkJson) {
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);

};

var checkTags = function(html, checksfile) {
//console.log(html);
    $ = cheerio.load(html);

    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url>', 'Path to http://url',checkUrlFormat,'')
	.parse(process.argv);

    checkHtml(program.file, program.url, program.checks);

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
