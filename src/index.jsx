import ForgeUI, {
  render,
  useProductContext,
  useState,
  Button,
  ButtonSet,
  Cell,
  Fragment,
  Head,
  Link,
  Row,
  Table,
  Text,
  IssuePanel,
} from '@forge/ui';

const SF_DOMAIN = 'https://paulyb-dev-ed.my.salesforce.com';
const SF_QUERY_ROUTE = '/services/data/v52.0/query/';
const NS = 'PROP3__';

const AUTH_TOKEN = '00D3i000000GQhJ!AQMAQIxyN4BHBtug7TOzkFu.pCWeptH0tSybFgDRpnSyG59.EKCD5SHJLOU.Ci.KFicXAKBVdmp5AzTT.L3iOeznJxafr1nM';

const App = () => {
  /** Get the context issue key */
  const { platformContext: { issueKey } } = useProductContext();
  console.log(issueKey);

  /** Set up a state object to hold response */
  const [rawRecords, setRecords] = useState(null);
  const records = rawRecords || [issueKey];

  const retrieveRelatedRecords = async (issueKey) => {
    const query = `SELECT+Id,Name,${NS}Approved_Released_DateTime__c,${NS}Record_Id__c,${NS}Record_Name__c,${NS}Record_Owner__c,${NS}Record_Status__c+FROM+${NS}Jira__c+WHERE+Name='${issueKey}'`;
    console.debug(query);
    const url = `${SF_DOMAIN}${SF_QUERY_ROUTE}?q=${query}`;
    console.debug(url);

    const response = await api.fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    await checkResponse('SALESFORCE', response, url);
    console.debug(response.text());
    /** Update UI with the response */
    const records = parseResponseForRecords(await response.text());
    setRecords(records || [issueKey]);
  }

  return (
    <Fragment>
      <ButtonSet>
        <Button
          text='Refresh'
          onClick={async () => { await retrieveRelatedRecords(issueKey); }}
        />
      </ButtonSet>
      <Table>
        <Head>
          <Cell>
            <Text>Propel Record Number</Text>
          </Cell>
          <Cell>
            <Text>Status</Text>
          </Cell>
          <Cell>
            <Text>Owner</Text>
          </Cell>
          <Cell>
            <Text>Approval Date</Text>
          </Cell>
        </Head>
        {records.map(issue => (
          <Row>
            <Cell>
              <Text>
                <Link href={issue.url}>{issue.key}</Link>
              </Text>
            </Cell>
            <Cell>
              <Text>{issue.status}</Text>
            </Cell>
            <Cell>
              <Text>{issue.owner}</Text>
            </Cell>
            <Cell>
              <Text>{issue.approvalDate}</Text>
            </Cell>
          </Row>
        ))}
      </Table>
    </Fragment>
  );
};

/**
 * Checks if a response was successful, and log and throw an error if not. 
 * Also logs the response body if the DEBUG_LOGGING env variable is set.
 * @param apiName a human readable name for the API that returned the response object
 * @param response a response object returned from `api.fetch()`, `requestJira()`, or similar
 */
async function checkResponse(apiName, response, url) {
  if (!response.ok) {
    const message = `Error from ${apiName}: ${response.status} | ${url} ${await response.text()}`;
    console.error(message);
    throw new Error(message);
  } else {
    console.debug(`Response from ${apiName}: ${await response.text()}`);
  }
}

/**
 * 
 */
function parseResponseForRecords(responseString) {
  const response = JSON.parse(responseString || '');
  const records = response.records || [];
  return records.map((rec) => {
    return {
      key: rec[`${NS}Record_Name__c`],
      status: rec[`${NS}Record_Status__c`],
      url: `${SF_DOMAIN}/${rec[`${NS}Record_Id__c`]}`,
      owner: rec[`${NS}Record_Owner__c`],
      approvalDate: rec[`${NS}Approved_Released_DateTime__c`]
    };
  });
}

export const run = render(
  <IssuePanel>
    <App />
  </IssuePanel>
);
