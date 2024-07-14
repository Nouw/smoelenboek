import * as Yup from "yup";
import { store } from "../../store/store";
import { seasonsApiSlice } from "../../api/endpoints/seasons.api";
import { formatISO } from "date-fns";

export const schema = Yup.object({
  startDate: Yup.date().test('overlap', 'Date is overlapping with an another season', (value) => overlap(value)),
  endDate: Yup.date().min(Yup.ref('startDate'), "End date cannot be before start date")
    .test('overlap', 'Date is overlapping with an another season', (value) => overlap(value))
})

function overlap(value: Date | undefined): Promise<boolean> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const url = window.location.pathname.split("/");
    const id = url[url.length - 1];

    const res = await store.dispatch(seasonsApiSlice.endpoints.getOverlap.initiate({ date: formatISO(value!), id: +id }));

    resolve(!(res.data!.length > 1))
  })
}
