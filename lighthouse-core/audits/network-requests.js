/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('./audit');
const URL = require('../lib/url-shim');

class NetworkRequests extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      name: 'network-requests',
      scoreDisplayMode: Audit.SCORING_MODES.INFORMATIVE,
      description: 'Network Requests',
      helpText: 'Lists the network requests that were made during page load.',
      requiredArtifacts: ['devtoolsLogs'],
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {Promise<LH.Audit.Product>}
   */
  static audit(artifacts) {
    const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
    return artifacts.requestNetworkRecords(devtoolsLog).then(records => {
      const earliestStartTime = records.reduce(
        (min, record) => Math.min(min, record.startTime),
        Infinity
      );

      const results = records.map(record => {
        return {
          url: URL.elideDataURI(record.url),
          startTime: (record.startTime - earliestStartTime) * 1000,
          endTime: (record.endTime - earliestStartTime) * 1000,
          transferSize: record.transferSize,
          statusCode: record.statusCode,
          mimeType: record._mimeType,
          resourceType: record._resourceType && record._resourceType._name,
        };
      });

      const headings = [
        {key: 'url', itemType: 'url', text: 'URL'},
        {key: 'startTime', itemType: 'ms', granularity: 1, text: 'Start Time'},
        {key: 'endTime', itemType: 'ms', granularity: 1, text: 'End Time'},
        {
          key: 'transferSize',
          itemType: 'bytes',
          displayUnit: 'kb',
          granularity: 1,
          text: 'Transfer Size',
        },
        {key: 'statusCode', itemType: 'text', text: 'Status Code'},
        {key: 'mimeType', itemType: 'text', text: 'MIME Type'},
        {key: 'resourceType', itemType: 'text', text: 'Resource Type'},
      ];

      const tableDetails = Audit.makeTableDetails(headings, results);

      return {
        score: 1,
        rawValue: results.length,
        extendedInfo: {value: results},
        details: tableDetails,
      };
    });
  }
}

module.exports = NetworkRequests;
