import React from 'react';

// --- Invoice Content Component (Shared for Preview and PDF) ---
const InvoiceContent = ({ data, id }: { data: any, id?: string }) => (
    <div id={id} className="p-8 md:p-12 font-serif bg-white min-h-screen text-black">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
            <div className="w-1/3">
                <div className="w-32 h-12 bg-gray-200 flex items-center justify-center text-gray-400 font-bold border border-gray-300 mb-2">LOGO</div>
                <h2 className="font-bold text-xl text-gray-900">ORKA ENERGY S.A. DE C.V.</h2>
                <p className="text-xs text-gray-600">RFC: OEN123456789</p>
                <p className="text-xs text-gray-600">Régimen Fiscal: 601-General de Ley Personas Morales</p>
                <p className="text-xs text-gray-600">Lugar de Expedición: 66260</p>
            </div>
            <div className="w-1/3 text-right">
                <div className="border border-gray-300 rounded p-2 bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">FACTURA</h3>
                    <p className="text-sm text-red-600 font-bold">A-12345</p>
                    <div className="mt-2 text-xs text-left space-y-1">
                        <div className="flex justify-between"><span className="text-gray-500">Folio Fiscal:</span> <span className="font-mono">75A2F...E12D</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Fecha:</span> <span>{new Date().toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Tipo:</span> <span>I-Ingreso</span></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Client Info */}
        <div className="bg-gray-50 rounded border border-gray-200 p-4 mb-6 text-sm">
            <h4 className="font-bold text-gray-700 border-b border-gray-200 pb-2 mb-2 uppercase text-xs tracking-wider">Receptor</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-gray-500 text-xs">Razón Social</p>
                    <p className="font-bold">{data.customer}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs">RFC</p>
                    <p className="font-bold">{data.rfc}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs">Uso CFDI</p>
                    <p>{data.usoCfdi}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs">Régimen Fiscal</p>
                    <p>{data.regimen}</p>
                </div>
            </div>
        </div>

        {/* Conceptos */}
        <table className="w-full text-sm mb-8">
            <thead>
                <tr className="bg-gray-800 text-white">
                    <th className="p-2 text-left w-20">Cant</th>
                    <th className="p-2 text-left w-20">Unidad</th>
                    <th className="p-2 text-left">Clave Prod/Serv-Descripción</th>
                    <th className="p-2 text-right w-32">Precio U.</th>
                    <th className="p-2 text-right w-32">Importe</th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-b border-gray-200">
                    <td className="p-2 align-top">{data.gallons.toLocaleString()}</td>
                    <td className="p-2 align-top text-gray-600">LTR-Litro</td>
                    <td className="p-2 align-top">
                        <span className="font-bold block text-gray-900">{data.product}</span>
                        <span className="text-xs text-gray-500">15101505-Combustible diesel</span>
                    </td>
                    <td className="p-2 align-top text-right">${data.rate}</td>
                    <td className="p-2 align-top text-right font-bold">${data.totalSale.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>

        {/* Totals & QR */}
        <div className="flex border-t-2 border-gray-800 pt-6">
            <div className="w-2/3 pr-8">
                <div className="flex gap-4 mb-4">
                    <div className="w-24 h-24 bg-gray-900 flex items-center justify-center text-white text-xs text-center p-2">
                        QR Code Placeholder
                    </div>
                    <div className="flex-1 text-[10px] text-gray-500 break-all space-y-2">
                        <p><strong className="text-gray-700">Sello Digital del CFDI:</strong><br />abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890...</p>
                        <p><strong className="text-gray-700">Sello del SAT:</strong><br />1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef...</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <span className="text-gray-500 block">Forma de Pago</span>
                        <span className="font-bold">99-Por definir</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Método de Pago</span>
                        <span className="font-bold">{data.metodoPago}</span>
                    </div>
                </div>
            </div>
            <div className="w-1/3 bg-gray-50 p-4 rounded text-right space-y-2">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${data.totalSale.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>IVA (16%)</span>
                    <span>${(data.totalSale * 0.16).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-300 pt-2 mt-2">
                    <span>Total</span>
                    <span>${(data.totalSale * 1.16).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    (Importe con letra simulado)
                </div>
            </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            Este documento es una representación impresa de un CFDI (Simulación)
        </div>
    </div>
);

export default InvoiceContent;
