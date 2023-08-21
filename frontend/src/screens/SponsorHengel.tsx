import React from "react";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import {pdfjs, Document, Page} from "react-pdf";
import {Card, CardContent} from "@mui/material";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface SponsorHengelProps {

}

export const SponsorHengel: React.FC<SponsorHengelProps> = () => {
  return (
    <Card>
      <CardContent>
        <Document file="/sponsor_hengel.pdf" onLoadSuccess={(pdf) => console.log(pdf)} onLoadError={console.error}>
          <Page pageNumber={1} scale={window.innerWidth < 1024 ? 1 : 0.8} width={window.innerWidth}/>
        </Document>
      </CardContent>
    </Card>
  )
}
