'use strict';

function buildFailure(name, failureMessage) {
  return {
    success: false,
    failure: {
      rule: name,
      message: failureMessage,
    },
  };
}

const DEFAULT_PRIORITY = 1;

function ruleNotFound(fact) {
  const name = 'Rule Not Found';
  const failureMessage = `rule or ruleSet does not exist`;
  return buildFailure(name, failureMessage);
}

function objectExists(fact) {
  const name = 'Object Exists';
  const failureMessage = 'object does not exist';
  let toReturn = {};

  if (!fact) {
    toReturn = buildFailure(name, failureMessage);
  } else {
    toReturn.success = true;
  }

  return toReturn;
}

function requestExists(fact) {
  const name = 'Request Exists';
  const failureMessage = 'request property not found at the root of given object.';
  let toReturn = {};

  if (!fact || !fact.request) {
    toReturn = buildFailure(name, failureMessage);
  } else {
    toReturn.success = true;
  }

  return toReturn;
}

function _addDefaultPriority(rule) {
  return {
    priority: DEFAULT_PRIORITY,
    rule: rule,
  };
}

function requestHasProperEvent(fact) {
  const name = 'Step Function Event Is Malformed';
  const failureMessage = 'request event is malformed';
  let toReturn = {};

  if (!fact.initial || !fact.data || !fact.errors || !fact.refs || !fact.meta || !fact.report) {
    toReturn = buildFailure(name, failureMessage);
  } else {
    toReturn.success = true;
  }

  return toReturn;
}

function requestRefExists(fact) {
  const name = 'Request Reference Exists';
  const failureMessage = 'request property not found at the root of refs.';
  let toReturn = {};

  if (!fact || !fact.refs || !fact.refs.request) {
    toReturn = buildFailure(name, failureMessage);
  } else {
    toReturn.success = true;
  }

  return toReturn;
}

function requestRefHasId(fact) {
  const name = 'Request Reference Has ID';
  const failureMessage = 'request does not have an ID';
  let toReturn = {};

  if (!fact.refs.request.id) {
    toReturn = buildFailure(name, failureMessage);
  } else {
    toReturn.success = true;
  }

  return toReturn;
}

function requestRefIsActive(fact) {
  const name = 'Request Reference Is Active';
  const failureMessage = 'request is not active';
  let toReturn = {};

  if (!fact.refs.request.active) {
    toReturn = buildFailure(name, failureMessage);
  } else {
    toReturn.success = true;
  }

  return toReturn;
}

function requestRefHasAccProgId(fact) {
  const name = 'Request Reference Has Account-Program ID';
  const failureMessage = 'request does not have an Account-Program ID';
  let toReturn = {};

  if (!fact.refs.request.account_program_id) {
    toReturn = buildFailure(name, failureMessage);
  } else {
    toReturn.success = true;
  }

  return toReturn;
}

function requestRefHasExecutionArn(fact) {
  const name = 'Request Reference Has Execution ARN';
  const failureMessage = 'request does not have an execution ARN';
  let toReturn = {};

  if (!fact.refs.request.execution_arn) {
    toReturn = buildFailure(name, failureMessage);
  } else {
    toReturn.success = true;
  }

  return toReturn;
}

function requestHasTempContainerAssets(fact) {
  const name = 'No Assets';
  const failureMessage = 'no container assets';
  let toReturn = {};

  if (!fact.refs.temp || !fact.refs.temp.containers || !fact.refs.temp.containers.assets) {
    toReturn = buildFailure(name, failureMessage);
  } else {
    toReturn.success = true;
  }

  return toReturn;
}

function tempContainerAssetsHaveS3URLs(fact) {
  const name = 'All Assets Need S3 URL';
  const failureMessage = 'missing s3_url on at least one asset';
  let toReturn = {};

  const assets = fact.refs.temp.containers.assets;
  const assetNames = Object.keys(assets);

  assetNames.forEach(assetName => {
    if (!assets[assetName].s3_url) {
      return toReturn = buildFailure(name, failureMessage);
    }
  });

  toReturn.success = true;

  return toReturn;
}

function tempContainerAssetsHaveSourceLanguage(fact) {
  const name = 'All Assets Need Source Locale';
  const failureMessage = 'missing source locale on at least one asset -- source_language is minimum requirement';
  let toReturn = {};

  const assets = fact.refs.temp.containers.assets;
  const assetNames = Object.keys(assets);

  assetNames.forEach(assetName => {
    if (!assets[assetName].source_langauge) {
      return toReturn = buildFailure(name, failureMessage);
    }
  });

  toReturn.success = true;

  return toReturn;
}

function tempContainerAssetsHaveFileType(fact) {
  const name = 'All Assets Need File Type';
  const failureMessage = 'missing file_type on at least one asset';
  let toReturn = {};

  const assets = fact.refs.temp.containers.assets;
  const assetNames = Object.keys(assets);

  assetNames.forEach(assetName => {
    if (!assets[assetName].file_type) {
      return toReturn = buildFailure(name, failureMessage);
    }
  });

  toReturn.success = true;

  return toReturn;
}

function requestHasTempContainerBundles(fact) {
  const name = 'No Bundles';
  const failureMessage = 'no container bundles';
  let toReturn = {};

  if (!fact.refs.temp || !fact.refs.temp.containers || !fact.refs.temp.containers.bundles || !fact.refs.temp.containers.bundles.length) {
    toReturn = buildFailure(name, failureMessage);
  } else {
    toReturn.success = true;
  }

  return toReturn;
}

function tempContainerBundlesHaveTargetLanguage(fact) {
  const name = 'All Bundles Need Target Locale';
  const failureMessage = 'missing target locale on at least one bundle -- target_language is minimum requirement';
  let toReturn = {};

  fact.refs.temp.containers.bundles.forEach(bundle => {
    if (!bundle.target_language) {
      return toReturn = buildFailure(name, failureMessage);
    }
  });

  toReturn.success = true;

  return toReturn;
}

function tempContainerBundlesHaveFiles(fact) {
  const name = 'All Bundles Need At Least One File';
  const failureMessage = 'missing files on at least one temp bundle';
  let toReturn = {};

  fact.refs.temp.containers.bundles.forEach(bundle => {
    if (!bundle.files || !Array.isArray(bundle.files) || !bundle.files.length) {
      return toReturn = buildFailure(name, failureMessage);
    }
  });

  toReturn.success = true;

  return toReturn;
}

module.exports = {
  objectExists: _addDefaultPriority(objectExists),
  requestExists: _addDefaultPriority(requestExists),
  ruleNotFound: _addDefaultPriority(ruleNotFound),
  TestRuleSet: [
    {
      priority: DEFAULT_PRIORITY,
      rule: objectExists,
    },
    {
      priority: DEFAULT_PRIORITY,
      rule: requestExists,
    },
  ],
  TestRuleSetPriority: [
    {
      priority: 1,
      rule: objectExists,
    },
    {
      priority: 2,
      rule: requestExists,
    },
  ],
  RequestHasRequiredInfoForProgram: [
    {
      priority: 1,
      rule: objectExists,
    },
    {
      priority: 2,
      rule: requestHasProperEvent,
    },
    {
      priority: 3,
      rule: requestRefExists,
    },
    {
      priority: 4,
      rule: requestRefHasId,
    },
    {
      priority: 4,
      rule: requestRefIsActive,
    },
    {
      priority: 4,
      rule: requestRefHasAccProgId,
    },
    {
      priority: 4,
      rule: requestRefHasExecutionArn,
    },
    {
      priority: 3,
      rule: requestHasTempContainerAssets,
    },
    {
      priority: 4,
      rule: tempContainerAssetsHaveS3URLs,
    },
    {
      priority: 4,
      rule: tempContainerAssetsHaveSourceLanguage,
    },
    {
      priority: 4,
      rule: tempContainerAssetsHaveFileType,
    },
    {
      priority: 3,
      rule: requestHasTempContainerBundles,
    },
    {
      priority: 4,
      rule: tempContainerBundlesHaveTargetLanguage,
    },
    {
      priority: 4,
      rule: tempContainerBundlesHaveFiles,
    },
  ],
};
