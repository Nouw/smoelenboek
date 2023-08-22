import * as Yup from "yup";
import apiclient from "../../../utilities/apiclient";
import moment from "moment";
import isNumeric from "../../../utilities/isNumeric";


const schema = Yup.object({
  startDate: Yup.date().test('overlap', 'Date is overlapping with an another season', (value) => overlap(value)),
  endDate: Yup.date().min(Yup.ref('startDate'), "End date cannot be before start date")
    .test('overlap', 'Date is overlapping with an another season', (value) => overlap(value))
})

function overlap(value: Date | undefined): Promise<boolean> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const url = window.location.pathname.split("/");
    const id = url[url.length - 1];

    let query = `protototo/overlap/${moment(value).toISOString()}`

    if (isNumeric(id)) {
      query += `?id=${id}`
    }

    const res = await apiclient.get(query)

    resolve(res.data.data);
  })
}

export default schema;
