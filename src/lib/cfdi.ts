// --- CFDI 4.0 Helpers ---

export const generateCFDI40XML = (data: any) => {
    const now = new Date().toISOString().split('.')[0];
    const subtotal = data.totalSale;
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    const folio = "12345";
    const serie = "A";
    const uuid = "75A2F2B4-C1E9-4D6C-A7E2-9B9D0E12D5C4"; // Simulated UUID

    return `<?xml version="1.0" encoding="UTF-8"?>
    <cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" Version="4.0" Serie="${serie}" Folio="${folio}" Fecha="${now}" Sello="abcdef123..." FormaPago="99" NoCertificado="00001000000504465930" Certificado="MIIG..." SubTotal="${subtotal.toFixed(2)}" Moneda="MXN" Total="${total.toFixed(2)}" TipoDeComprobante="I" Exportacion="01" MetodoPago="${data.metodoPago}" LugarExpedicion="66260">
        <cfdi:Emisor Rfc="OEN123456789" Nombre="ORKA ENERGY S.A. DE C.V." RegimenFiscal="601" />
        <cfdi:Receptor Rfc="${data.rfc}" Nombre="${data.customer}" DomicilioFiscalReceptor="66260" RegimenFiscalReceptor="601" UsoCFDI="${data.usoCfdi.split('-')[0]}" />
        <cfdi:Conceptos>
            <cfdi:Concepto ClaveProdServ="15101505" NoIdentificacion="FUEL-001" Cantidad="${data.gallons}" ClaveUnidad="LTR" Unidad="Litro" Descripcion="${data.product}" ValorUnitario="${data.rate.toFixed(4)}" Importe="${subtotal.toFixed(2)}" ObjetoImp="02">
                <cfdi:Impuestos>
                    <cfdi:Traslados>
                        <cfdi:Traslado Base="${subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${iva.toFixed(2)}" />
                    </cfdi:Traslados>
                </cfdi:Impuestos>
            </cfdi:Concepto>
        </cfdi:Conceptos>
        <cfdi:Impuestos TotalImpuestosTrasladados="${iva.toFixed(2)}">
            <cfdi:Traslados>
                <cfdi:Traslado Base="${subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${iva.toFixed(2)}" />
            </cfdi:Traslados>
        </cfdi:Impuestos>
        <cfdi:Complemento>
            <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xsi:schemaLocation="http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" Version="1.1" UUID="${uuid}" FechaTimbrado="${now}" RfcProvCertif="SAT970701NN3" SelloCFD="abcdef..." NoCertificadoSAT="00001000000504465028" SelloSAT="xyz123..." />
        </cfdi:Complemento>
    </cfdi:Comprobante>`;
};

export const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};
