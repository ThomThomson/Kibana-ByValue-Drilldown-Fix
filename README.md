# Kibana By Value Drilldown Fix

### Issue
In Kibana 7.13.1, a serious migration bug was introduced. Dashboards that have by value panels with Drilldowns attached would cause the dashboard migration to fail. 

### Workaround
This small node program is a workaround for that issue. It takes elasticsearch credentials, and removes drilldowns from any by value panels so that the migrations can pass. 

### How to Run
This requires node version 14.17.0 in order to run. [NVM](https://github.com/nvm-sh/nvm) is recommended to manage your node versions.

`yarn install`

`node index.js`
