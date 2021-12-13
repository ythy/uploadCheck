@echo off

SET base=%~dp0
rem SET file=%base%/sources/MP/package.json
SET file=%base%/sources/MP/package.json

SET /P versionNew= Please enter new version code [x.x.x]:
SET /P versionOld= Please enter old version code [x.x.x]:

 
rem cd /d %base%/sources/MP

call node ./bin/run -n %versionNew% -d %versionOld%

pause