export interface Sale {
    id: string;
    date: string; // ISO Date "YYYY-MM-DD"
    product: string;
    terminal: string;
    carrier: string;
    truck: string;
    trailer: string;
    status: 'DONE' | 'BOL UPDATED' | 'POD PENDING' | 'ON TRACK' | 'LOADING' | 'APPROVED' | 'INTENTION';
    bol: string;
    netBarrels: number;
    gallons: number;
    customer: string;
    rate: number;
    totalSale: number;
    unitCost?: number; // Cost per gallon
    invoiced?: boolean;
    paidAmount?: number;
    paymentStatus?: 'PAID' | 'PARTIAL' | 'PENDING';
    paymentDate?: string;
}

export const salesData: Sale[] = [
    { id: "1", date: "2023-10-25", product: "ULSD", terminal: "BLUEWING", carrier: "SPBR", truck: "1002", trailer: "530", status: "DONE", bol: "1223703", netBarrels: 144.52, gallons: 6070, customer: "ALEXIS", rate: 2.4900, totalSale: 15114.30, unitCost: 2.2410, invoiced: true, paymentStatus: 'PAID', paidAmount: 15114.30 },
    { id: "2", date: "2023-10-25", product: "ULSD", terminal: "BLUEWING", carrier: "SPBR", truck: "1002", trailer: "530", status: "DONE", bol: "1223924", netBarrels: 159.88, gallons: 6715, customer: "ALEXIS", rate: 2.4800, totalSale: 16653.20, unitCost: 2.2320, invoiced: true, paymentStatus: 'PARTIAL', paidAmount: 10000.00 },
    { id: "3", date: "2023-10-26", product: "ULSD", terminal: "SUNOCO", carrier: "RHINO", truck: "2759", trailer: "274", status: "DONE", bol: "64663", netBarrels: 170.19, gallons: 7148, customer: "ALEXIS", rate: 3.7808, totalSale: 27025.16, unitCost: 3.4027, invoiced: true, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "4", date: "2023-10-26", product: "ULSD", terminal: "SUNOCO", carrier: "RHINO", truck: "2759", trailer: "274", status: "BOL UPDATED", bol: "64672", netBarrels: 170.71, gallons: 7170, customer: "ALEXIS", rate: 3.7808, totalSale: 27108.34, unitCost: 3.4027, invoiced: false, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "5", date: "2023-10-26", product: "ULSD", terminal: "SUNOCO", carrier: "RHINO", truck: "2759", trailer: "274", status: "BOL UPDATED", bol: "64995", netBarrels: 170.26, gallons: 7151, customer: "ALEXIS", rate: 3.9499, totalSale: 28245.73, unitCost: 3.5549, invoiced: false, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "6", date: "2023-10-27", product: "ULSD", terminal: "SUNOCO", carrier: "RHINO", truck: "2759", trailer: "274", status: "BOL UPDATED", bol: "65093", netBarrels: 171.38, gallons: 7198, customer: "ALEXIS", rate: 3.9225, totalSale: 28234.16, unitCost: 3.5302, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "7", date: "2023-10-27", product: "ULSD", terminal: "SUNOCO", carrier: "RHINO", truck: "2759", trailer: "274", status: "BOL UPDATED", bol: "65247", netBarrels: 172.26, gallons: 7235, customer: "ALEXIS", rate: 3.9984, totalSale: 28928.42, unitCost: 3.5985, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "8", date: "2023-10-27", product: "ULSD", terminal: "SUNOCO", carrier: "RHINO", truck: "2759", trailer: "274", status: "BOL UPDATED", bol: "65296", netBarrels: 172.14, gallons: 7230, customer: "ALEXIS", rate: 3.9984, totalSale: 28908.43, unitCost: 3.5985, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "9", date: "2023-10-28", product: "ETHANOL", terminal: "BLUEWING", carrier: "ORKH", truck: "408", trailer: "20", status: "POD PENDING", bol: "1240413", netBarrels: 264.43, gallons: 11106, customer: "ALPHA", rate: 2.2400, totalSale: 24877.44, unitCost: 2.0160, paymentStatus: 'PAID', paidAmount: 24877.44 },
    { id: "10", date: "2023-10-28", product: "ETHANOL", terminal: "BLUEWING", carrier: "ORKH", truck: "HS162", trailer: "22", status: "POD PENDING", bol: "1240414", netBarrels: 264.45, gallons: 11107, customer: "ALPHA", rate: 2.2400, totalSale: 24879.68, unitCost: 2.0160, paymentStatus: 'PAID', paidAmount: 24879.68 },
    { id: "11", date: "2023-10-28", product: "ETHANOL", terminal: "BLUEWING", carrier: "ORKH", truck: "HS287", trailer: "23", status: "POD PENDING", bol: "1240416", netBarrels: 257.48, gallons: 10814, customer: "ALPHA", rate: 2.2400, totalSale: 24223.36, unitCost: 2.0160, paymentStatus: 'PAID', paidAmount: 24223.36 },
    { id: "12", date: "2023-10-29", product: "ETHANOL", terminal: "BLUEWING", carrier: "ORKH", truck: "RM03", trailer: "16", status: "POD PENDING", bol: "1240417", netBarrels: 264.48, gallons: 11108, customer: "ALPHA", rate: 2.2400, totalSale: 24881.92, unitCost: 2.0160, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "13", date: "2023-10-29", product: "ETHANOL", terminal: "BLUEWING", carrier: "ORKH", truck: "648", trailer: "15", status: "POD PENDING", bol: "1240420", netBarrels: 264.45, gallons: 11107, customer: "ALPHA", rate: 2.2400, totalSale: 24879.68, unitCost: 2.0160, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "14", date: "2023-10-29", product: "ETHANOL", terminal: "BLUEWING", carrier: "ORKH", truck: "HS287", trailer: "23", status: "POD PENDING", bol: "1240416", netBarrels: 7.00, gallons: 294, customer: "ALPHA", rate: 2.2400, totalSale: 658.56, unitCost: 2.0160, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "15", date: "2023-10-30", product: "ETHANOL", terminal: "BLUEWING", carrier: "ORKH", truck: "648", trailer: "15", status: "ON TRACK", bol: "1240570", netBarrels: 263.95, gallons: 11086, customer: "ALPHA", rate: 2.2200, totalSale: 24610.92, unitCost: 1.9980, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "16", date: "2023-10-30", product: "ETHANOL", terminal: "BLUEWING", carrier: "ORKH", truck: "RM02", trailer: "18", status: "ON TRACK", bol: "1240602", netBarrels: 263.98, gallons: 11087, customer: "ALPHA", rate: 2.2200, totalSale: 24613.14, unitCost: 1.9980, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "17", date: "2023-10-30", product: "ETHANOL", terminal: "BLUEWING", carrier: "LUJE", truck: "16", trailer: "A19", status: "ON TRACK", bol: "1240594", netBarrels: 263.98, gallons: 11087, customer: "ALPHA", rate: 2.2200, totalSale: 24613.14, unitCost: 1.9980, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "18", date: "2023-10-30", product: "ETHANOL", terminal: "BLUEWING", carrier: "ORKH", truck: "15", trailer: "17", status: "ON TRACK", bol: "1240577", netBarrels: 263.98, gallons: 11087, customer: "ALPHA", rate: 2.2200, totalSale: 24613.14, unitCost: 1.9980, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "19", date: "2023-10-30", product: "ETHANOL", terminal: "BLUEWING", carrier: "ORKH", truck: "HS162", trailer: "22", status: "ON TRACK", bol: "1240582", netBarrels: 264.00, gallons: 11088, customer: "ALPHA", rate: 2.2200, totalSale: 24615.36, unitCost: 1.9980, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "20", date: "2023-10-31", product: "ETHANOL", terminal: "BLUEWING", carrier: "RODEGA", truck: "10", trailer: "24", status: "ON TRACK", bol: "1240590", netBarrels: 263.98, gallons: 11087, customer: "ALPHA", rate: 2.2200, totalSale: 24613.14, unitCost: 1.9980, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "21", date: "2023-10-31", product: "ETHANOL", terminal: "SUNOCO", carrier: "RHINO", truck: "W661", trailer: "5537", status: "ON TRACK", bol: "64064", netBarrels: 167.50, gallons: 7035, customer: "ALPHA", rate: 2.0450, totalSale: 14386.58, unitCost: 1.8405, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "22", date: "2023-10-31", product: "ETHANOL", terminal: "SUNOCO", carrier: "RHINO", truck: "50", trailer: "9594", status: "ON TRACK", bol: "64070", netBarrels: 167.57, gallons: 7038, customer: "ALPHA", rate: 2.0450, totalSale: 14392.71, unitCost: 1.8405, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "23", date: "2023-10-31", product: "ETHANOL", terminal: "SUNOCO", carrier: "RHINO", truck: "66", trailer: "5537", status: "ON TRACK", bol: "64105", netBarrels: 167.60, gallons: 7039, customer: "ALPHA", rate: 2.0450, totalSale: 14394.76, unitCost: 1.8405, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "24", date: "2023-11-01", product: "ETHANOL", terminal: "SUNOCO", carrier: "RHINO", truck: "181", trailer: "9594", status: "LOADING", bol: "64112", netBarrels: 167.60, gallons: 7039, customer: "ALPHA", rate: 2.0450, totalSale: 14394.76, unitCost: 1.8405, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "25", date: "2023-11-01", product: "ETHANOL", terminal: "SUNOCO", carrier: "RHINO", truck: "891S", trailer: "5537", status: "LOADING", bol: "64114", netBarrels: 167.64, gallons: 7041, customer: "ALPHA", rate: 2.0450, totalSale: 14398.85, unitCost: 1.8405, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "26", date: "2023-11-01", product: "ETHANOL", terminal: "SUNOCO", carrier: "RHINO", truck: "S819", trailer: "2513", status: "LOADING", bol: "64126", netBarrels: 138.14, gallons: 5802, customer: "ALPHA", rate: 2.0675, totalSale: 11995.64, unitCost: 1.8607, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "27", date: "2023-11-01", product: "ETHANOL", terminal: "SUNOCO", carrier: "RHINO", truck: "1", trailer: "2513", status: "LOADING", bol: "64191", netBarrels: 168.64, gallons: 7083, customer: "ALPHA", rate: 2.0675, totalSale: 14644.10, unitCost: 1.8607, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "28", date: "2023-11-02", product: "ETHANOL", terminal: "SUNOCO", carrier: "UNIFY", truck: "1116", trailer: "9594", status: "LOADING", bol: "64258", netBarrels: 168.88, gallons: 7093, customer: "ALPHA", rate: 2.0600, totalSale: 14611.58, unitCost: 1.8540, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "29", date: "2023-11-02", product: "NAPHTHA", terminal: "BLUEWING", carrier: "CART", truck: "22", trailer: "FP05", status: "LOADING", bol: "1224862", netBarrels: 169.67, gallons: 7126, customer: "ENERGAX", rate: 1.8000, totalSale: 12826.80, unitCost: 1.6200, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "30", date: "2023-11-02", product: "NAPHTHA", terminal: "BLUEWING", carrier: "CART", truck: "31", trailer: "FP16", status: "LOADING", bol: "1225356", netBarrels: 175.24, gallons: 7360, customer: "ENERGAX", rate: 1.8200, totalSale: 13395.20, unitCost: 1.6380, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "31", date: "2023-11-03", product: "NAPHTHA", terminal: "BLUEWING", carrier: "CART", truck: "24", trailer: "FP15", status: "LOADING", bol: "1225357", netBarrels: 175.50, gallons: 7371, customer: "ENERGAX", rate: 1.8200, totalSale: 13415.22, unitCost: 1.6380, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "32", date: "2023-11-03", product: "NAPHTHA", terminal: "MOTUS", carrier: "CART", truck: "24", trailer: "FP15", status: "LOADING", bol: "12763", netBarrels: 175.00, gallons: 7350, customer: "ENERGAX", rate: 1.8275, totalSale: 13432.13, unitCost: 1.6447, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "33", date: "2023-11-03", product: "NAPHTHA", terminal: "MOTUS", carrier: "CART", truck: "31", trailer: "FP16", status: "LOADING", bol: "12762", netBarrels: 175.00, gallons: 7350, customer: "ENERGAX", rate: 1.8275, totalSale: 13432.13, unitCost: 1.6447, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "34", date: "2023-11-03", product: "NAPHTHA", terminal: "BLUEWING", carrier: "PEGASUS", truck: "181", trailer: "EGX4", status: "LOADING", bol: "1226299", netBarrels: 192.45, gallons: 8083, customer: "ENERGAX", rate: 1.8000, totalSale: 14549.40, unitCost: 1.6200, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "35", date: "2023-11-04", product: "ULSD", terminal: "TITAN", carrier: "XELA", truck: "5", trailer: "268", status: "LOADING", bol: "65161", netBarrels: 3280.80, gallons: 137793.6, customer: "ENGIOIL LOGISTICS", rate: 2.1900, totalSale: 301767.90, unitCost: 1.9710, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "36", date: "2023-11-04", product: "ULSD", terminal: "TITAN", carrier: "XELA", truck: "55", trailer: "288", status: "LOADING", bol: "516898", netBarrels: 2717.98, gallons: 114155.3, customer: "ENGIOIL LOGISTICS", rate: 2.1462, totalSale: 245000.00, unitCost: 1.9316, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "37", date: "2023-11-04", product: "ULSD", terminal: "TITAN", carrier: "BTO TRANSPORT", truck: "2", trailer: "2513", status: "LOADING", bol: "244238", netBarrels: 176.19, gallons: 7400, customer: "Puente", rate: 2.2900, totalSale: 16946.00, unitCost: 2.0610, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "38", date: "2023-11-05", product: "ULSD", terminal: "TITAN", carrier: "XELA", truck: "XT44", trailer: "404", status: "LOADING", bol: "242112", netBarrels: 166.67, gallons: 7000, customer: "Puente", rate: 2.1600, totalSale: 15120.00, unitCost: 1.9440, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "39", date: "2023-11-05", product: "ULSD", terminal: "TITAN", carrier: "CAN2 LOGISTICS", truck: "2759", trailer: "274", status: "LOADING", bol: "242387", netBarrels: 171.43, gallons: 7200, customer: "Puente", rate: 2.1900, totalSale: 15768.00, unitCost: 1.9710, paymentStatus: 'PENDING', paidAmount: 0 },
    { id: "40", date: "2023-11-05", product: "ULSD", terminal: "TITAN", carrier: "Transmont", truck: "45", trailer: "RM011", status: "LOADING", bol: "243166", netBarrels: 171.43, gallons: 7200, customer: "Puente", rate: 2.2600, totalSale: 16272.00, unitCost: 2.0340, paymentStatus: 'PENDING', paidAmount: 0 },
];

// Helper functions for data analysis
export const getUniqueValues = (key: keyof Sale) => {
    return Array.from(new Set(salesData.map(item => item[key]))).sort();
};

export const getMetrics = (filters?: { date?: string, client?: string, product?: string }) => {
    let filteredData = salesData;

    if (filters) {
        if (filters.date && filters.date !== 'ALL') {
            filteredData = filteredData.filter(s => s.date === filters.date);
        }
        if (filters.client && filters.client !== 'ALL') {
            filteredData = filteredData.filter(s => s.customer === filters.client);
        }
        if (filters.product && filters.product !== 'ALL') {
            filteredData = filteredData.filter(s => s.product === filters.product);
        }
    }

    const totalVolume = filteredData.reduce((acc, curr) => acc + curr.gallons, 0);
    const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.totalSale, 0);
    const activeFleet = filteredData.filter(s => ['ON TRACK', 'LOADING'].includes(s.status)).length;

    // Group by status
    const statusCounts = filteredData.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const activeOrders = filteredData.filter(sale =>
        ['LOADING', 'ON TRACK', 'BOL UPDATED', 'POD PENDING', 'APPROVED', 'INTENTION'].includes(sale.status)
    );

    // Revenue by Product calculation
    const revenueByProduct = filteredData.reduce((acc, curr) => {
        acc[curr.product] = (acc[curr.product] || 0) + curr.totalSale;
        return acc;
    }, {} as Record<string, number>);

    // Volume by Product calculation
    const volumeByProduct = filteredData.reduce((acc, curr) => {
        acc[curr.product] = (acc[curr.product] || 0) + curr.gallons;
        return acc;
    }, {} as Record<string, number>);

    // Revenue by Client (Top Clients)
    const revenueByClient = filteredData.reduce((acc, curr) => {
        acc[curr.customer] = (acc[curr.customer] || 0) + curr.totalSale;
        return acc;
    }, {} as Record<string, number>);

    const totalOrdersCount = filteredData.length;

    // Lists for filters
    const availableDates = Array.from(new Set(salesData.map(s => s.date))).sort().reverse();
    const availableClients = Array.from(new Set(salesData.map(s => s.customer))).sort();
    const availableProducts = Array.from(new Set(salesData.map(s => s.product))).sort();

    return {
        totalRevenue,
        totalVolume,
        activeFleet,
        statusCounts,
        activeOrders,
        revenueByProduct,
        volumeByProduct,
        revenueByClient,
        totalOrdersCount,
        availableDates,
        availableClients,
        availableProducts
    };
};

export const getClientBalances = (filterClient: string = 'ALL') => {
    const dates = salesData.map(s => s.date).sort();
    const latestDate = dates[dates.length - 1];

    const clients = Array.from(new Set(salesData.map(s => s.customer)));

    const results = clients.map(client => {
        const clientSales = salesData.filter(s => s.customer === client);
        const currentTotal = clientSales.reduce((acc, s) => acc + s.totalSale, 0);
        const currentPaid = clientSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
        const currentPending = currentTotal - currentPaid;

        // Previous day balance: sales before latestDate minus payments before latestDate
        const prevSales = clientSales.filter(s => s.date < latestDate);
        const prevTotal = prevSales.reduce((acc, s) => acc + s.totalSale, 0);
        const prevPaid = prevSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
        const prevBalance = prevTotal - prevPaid;

        return {
            client,
            currentPending,
            prevBalance,
            limit: client === 'Trans. del Norte' ? 2000000 : (client === 'ALPHA' ? 1500000 : 500000),
            status: client === 'Gasolineras Lopez' ? 'Blocked' : 'Active'
        };
    });

    if (filterClient !== 'ALL') {
        return results.filter(r => r.client === filterClient);
    }

    return results;
};

export const getDetailedBalanceReport = (filterClient: string = 'ALL', targetDate?: string, onlyOverdue?: boolean) => {
    const dates = salesData.map(s => s.date).sort();
    const latestDate = targetDate || dates[dates.length - 1];

    const clients = filterClient === 'ALL'
        ? Array.from(new Set(salesData.map(s => s.customer)))
        : [filterClient];

    return clients.map(client => {
        const clientSales = salesData.filter(s => s.customer === client);

        // Opening Balance (Balance before latestDate)
        const prevSales = clientSales.filter(s => s.date < latestDate);
        const prevTotal = prevSales.reduce((acc, s) => acc + s.totalSale, 0);
        const prevPaid = prevSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
        const openingBalance = prevTotal - prevPaid;

        // Today's loads
        const todayLoads = clientSales.filter(s => s.date === latestDate);
        const dailyTotal = todayLoads.reduce((acc, s) => acc + s.totalSale, 0);

        // Today's payments (Payments MADE on this date)
        const todayPayments = clientSales.filter(s => s.paymentDate === latestDate);
        const dailyPayments = todayPayments.reduce((acc, s) => acc + (s.paidAmount || 0), 0);

        // Final Balance (Cumulative)
        const totalAmount = clientSales.reduce((acc, s) => acc + s.totalSale, 0);
        const totalPaid = clientSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
        const closingBalance = totalAmount - totalPaid;

        if (onlyOverdue) {
            const collectionDetail = getClientCollectionDetail(client);
            const overdueLoads = collectionDetail.loads.filter(l => l.collectionStatus === 'overdue');

            if (overdueLoads.length === 0) return null; // Skip clients with no overdue items if filtered

            return {
                client,
                date: latestDate,
                openingBalance: collectionDetail.currentBalance, // Simplified for overdue report
                todayLoads: overdueLoads,
                todayPayments: [],
                dailyTotal: overdueLoads.reduce((acc, l) => acc + l.totalSale, 0),
                dailyPayments: 0,
                closingBalance: overdueLoads.reduce((acc, l) => acc + l.totalSale, 0)
            };
        }

        return {
            client,
            date: latestDate,
            openingBalance,
            todayLoads,
            todayPayments,
            dailyTotal,
            dailyPayments,
            closingBalance
        };
    }).filter(Boolean);
};
// --- Collection Detail Calculation ---
export const getClientCollectionDetail = (clientName: string, targetDate?: string) => {
    const dates = salesData.map(s => s.date).sort();
    const referenceDateStr = targetDate || dates[dates.length - 1];
    const referenceDate = new Date(referenceDateStr);
    referenceDate.setHours(0, 0, 0, 0);

    const clientSales = salesData.filter(s => s.customer === clientName && s.date <= referenceDateStr);

    // Credit limits matching getClientBalances logic
    const creditLimit = clientName === 'Trans. del Norte' ? 2000000 : (clientName === 'ALPHA' ? 1500000 : 500000);

    // Define payment terms based on client or default to 7 days
    const paymentTermDays = (clientName === 'ALEXIS' || clientName === 'ALPHA') ? 15 : 7;

    const details = clientSales.map(sale => {
        const loadDate = new Date(sale.date);
        const dueDate = new Date(loadDate);
        dueDate.setDate(dueDate.getDate() + paymentTermDays);

        let status: 'paid' | 'on-time' | 'due-today' | 'overdue' = 'on-time';

        if (sale.paymentStatus === 'PAID') {
            status = 'paid';
        } else if (dueDate < referenceDate) {
            status = 'overdue';
        } else if (dueDate.getTime() === referenceDate.getTime()) {
            status = 'due-today';
        }

        return {
            ...sale,
            paymentTermDays,
            dueDate: dueDate.toISOString().split('T')[0],
            collectionStatus: status
        };
    });

    // Sorting by date descending (most recent first)
    const sortedLoads = details.sort((a, b) => b.date.localeCompare(a.date));
    const overdueLoads = details.filter(d => d.collectionStatus === 'overdue');

    let maxOverdueDays = 0;
    if (overdueLoads.length > 0) {
        const oldestDueDate = new Date(overdueLoads.reduce((oldest, current) =>
            current.dueDate < oldest ? current.dueDate : oldest, overdueLoads[0].dueDate));
        maxOverdueDays = Math.floor((referenceDate.getTime() - oldestDueDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
        client: clientName,
        date: referenceDateStr,
        creditLimit,
        currentBalance: details.filter(d => d.paymentStatus !== 'PAID').reduce((acc, d) => acc + d.totalSale, 0),
        overdueCount: overdueLoads.length,
        maxOverdueDays,
        loads: sortedLoads
    };
};
