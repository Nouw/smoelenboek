import { oracleUpload } from "../Utilities/Oracle";
import { idExists } from "./BaseRules";

export const uploadPhoto = [oracleUpload.single("photo"), idExists];
