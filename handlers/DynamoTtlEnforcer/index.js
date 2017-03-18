"use strict";

// a gentleman to run on a timer in CloudWatch Events
// who will force the actual delete of expired TTL items
// in case we see that Dynamo's best effort isn't quite good enough
// this assumes that our Enforcer would be granted
// higher priority than the dynamo background TTL guy