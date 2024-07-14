import React from "react";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import {pdfjs, Document, Page} from "react-pdf";
import {Card, CardContent} from "@mui/material";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export const SponsorHengel: React.FC = () => {
  return (
    <Card>
      <CardContent>
        <Document file="/sponsor_hengel.pdf" onLoadError={console.error}>
          <Page pageNumber={1} scale={window.innerWidth < 1024 ? 1 : 0.8} width={window.innerWidth}/>
        </Document>
      </CardContent>
    </Card>
  )
}
