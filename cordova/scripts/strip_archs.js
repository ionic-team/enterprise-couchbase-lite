var xcode = require('xcode');
var fs = require('fs');
var path = require('path');

const xcodeProjPath = fromDir('platforms/ios', '.xcodeproj');
const projectPath = xcodeProjPath + '/project.pbxproj';
const myProj = xcode.project(projectPath);
const scriptCode = fs.readFileSync(path.join('plugins', '@ionic-enterprise', 'couchbase-lite', 'cordova', 'src', 'ios', 'CouchbaseLite.framework', 'Scripts', 'strip_frameworks.sh'), 'utf8');

var options = { shellPath: '/bin/sh', shellScript: scriptCode };

myProj.parse(function(err) {
  myProj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Strip CouchbaseLite.framework architectures', myProj.getFirstTarget().uuid, options);
  fs.writeFileSync(projectPath, myProj.writeSync());
})

function fromDir(startPath, filter) {
  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return;
  }
  const files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    if (filename.indexOf(filter) >= 0) {
        return filename;
    }
  }
}