const { Audit, NetworkRecords } = require('lighthouse');
const Greencheck = require('../helpers/greencheck')

function createErrorResult(err) {
  console.log(err)
  // throw new Error("fail")
  return {
    score: null,
    errorMessage: err.toString()
  }
}

class GreenAudit extends Audit {
  static get meta() {
    return {
      id: 'greenhouse-id',
      title: 'Page is built using resources from servers running on green energy',
      failureTitle: 'Page is built using resources from servers running on fossil fuels',
      description:
        'Burning fossil fuels to power servers is avoidable, ' +
        'and contributes to climate breakdown. ' +
        'See the [W3C Ethical Web Principles](https://www.w3.org/2001/tag/doc/ethical-web-principles/), on Sustainable Web, and learn more at [The Green Web Foundation](https://www.thegreenwebfoundation.org/) '
      ,
      scoredisplayMode: 'numeric',
      requiredArtifacts: ['devtoolsLogs'],
    };
  }



  static async audit(artifacts, context) {
    // Artifacts requested in `requiredArtifacts` above are passed to your audit.
    // See the "API -> Plugin Audits" section below for what artifacts are available.

    try {
      const devtoolsLog = artifacts.devtoolsLogs[Audit.DEFAULT_PASS];
      const requests = await NetworkRecords.request(devtoolsLog, context);

      let domains = new Set()
      requests.forEach(req => {
        domains.add(new URL(req.url).host)
      })

      // the spread syntax turns our deduped set into an array, then makes sure they're long enough to check
      const domainArray = [...domains].filter(domain => { return domain.length > 2 })

      const checkResults = await Greencheck.checkDomains(domainArray)

      const greyDomainResults = checkResults.greenChecks.filter(res => { return res.green == false })

      return {

        score: checkResults.score,
        numericValue: greyDomainResults.length,
      }
    } catch (error) {
      createErrorResult(error)
    }
  }

}

module.exports = GreenAudit;