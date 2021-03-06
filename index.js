const prompt = require("prompt-async");
const { Client } = require('@elastic/elasticsearch')

const promptSchema = {
  properties: {
    esUrl: {
      required: true,
      message: 'Elasticsearch endpoint',
    },
    username: {
      pattern: /^[a-zA-Z\s\-]+$/,
      required: true
    },
    password: {
      hidden: true,
      required: true
    }
  }
};

const updatePanelsJson = (originalJson) => {
  let updateCount = 0;
  const panelsParsed = JSON.parse(originalJson);
  panelsParsed?.forEach((panel) => {
    // if the panel is by value AND has enhancements, delete the enhancements
    if((panel?.embeddableConfig?.attributes || panel?.embeddableConfig?.savedVis) && panel?.embeddableConfig?.enhancements) {
      delete panel.embeddableConfig.enhancements;
      updateCount++;
    }
  });
  return { newPanelsJSON: JSON.stringify(panelsParsed), updateCount };
};

(async () => {
  prompt.start();
  const { esUrl, username, password } = await prompt.get(promptSchema);
  const kibanaIndex = '.kibana';
  const client = new Client({
    node: esUrl,
    auth: {
      username: username,
      password: password
    }
  });

  const allDashboards = await client.search({
    index: '.kibana',
    body: {
      "query": {
        "match": {
          "type": "dashboard"
        }
      },
      "size": 10000
    }
  });
  if(!allDashboards.body.hits?.hits) { 
    return;
  }
  for (const hit of allDashboards.body.hits?.hits) {
    const dashboardId = hit._id;
    const dashboard = hit._source.dashboard;
    console.log('Analyzing: ', dashboard.title);
    const { newPanelsJSON, updateCount } = updatePanelsJson(dashboard.panelsJSON);

    if (updateCount === 0) {
      console.log('--No panels to update\n');
      continue;
    }

    await client.update({
      index: kibanaIndex,
      id: dashboardId,
      body: {
        doc: {
          dashboard: {
            panelsJSON: newPanelsJSON
          }
        }
      }
    });
    console.log(`--updated ${updateCount} panels\n`);
  }
})();