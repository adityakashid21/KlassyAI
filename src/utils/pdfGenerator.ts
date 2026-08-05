import * as RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Alert, PermissionsAndroid, Platform, Linking } from 'react-native';
import FileViewer from 'react-native-file-viewer';
import notifee, { AndroidImportance } from '@notifee/react-native';
import RNFS from 'react-native-fs';

const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
        const androidVersion = Platform.Version as number;
        
        // Android 13+ (API 33+)
        if (androidVersion >= 33) {
            return true;
        }

        // Android 10-12 (API 29-32)
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
                title: 'Storage Permission Required',
                message: 'KlassyAI needs storage access to save PDFs to your device',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK'
            }
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
        console.warn('Permission error:', err);
        return false;
    }
};

const showDownloadNotification = async (fileName: string, filePath: string) => {
    try {
        await notifee.displayNotification({
            title: '✅ Download Complete!',
            body: `${fileName} has been saved`,
            android: {
                channelId: 'downloads',
                importance: AndroidImportance.HIGH,
                pressAction: { id: 'default' },
                color: '#4CAF50',
                smallIcon: 'ic_launcher', // Use ic_launcher as it always exists
                actions: [
                    {
                        title: 'Open File',
                        pressAction: { id: 'open', launchActivity: 'default' }
                    }
                ]
            },
            data: { filePath }
        });

        // Handle notification action
        notifee.onBackgroundEvent(async ({ type, detail }: { type: any, detail: any }) => {
            if (detail.pressAction?.id === 'open' && detail.notification?.data?.filePath) {
                await openFile(detail.notification.data.filePath as string);
            }
        });
    } catch (error) {
        console.log('Notification error:', error);
    }
};

const openFile = async (filePath: string) => {
    try {
        const fileExists = await RNFS.exists(filePath);
        if (!fileExists) {
            Alert.alert('Error', 'File not found at: ' + filePath);
            return;
        }

        await FileViewer.open(filePath, {
            showOpenWithDialog: true,
            showAppsSuggestions: true
        });
    } catch (error) {
        Alert.alert('Error', 'Could not open file. Please check your file manager.');
        console.log('FileViewer Error:', error);
    }
};

export const generateFeeReceipt = async (feeData: any, studentData: any, teacherData: any) => {
    try {
        // Request permission
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Storage permission is required to download receipts');
            return null;
        }

        const receiptNumber = `${feeData.id.slice(0, 8).toUpperCase()}`;
        const receiptDate = feeData.paid_date ? new Date(feeData.paid_date).toLocaleDateString() : new Date().toLocaleDateString();

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: white;
        }
        .container {
            border: 3px solid #000;
            padding: 0;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            padding: 30px;
            border-bottom: 3px solid #000;
        }
        .header h1 {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        .header p {
            font-size: 14px;
            margin: 5px 0;
        }
        .receipt-title {
            background: #000;
            color: white;
            padding: 15px;
            text-align: center;
        }
        .receipt-title h2 {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 3px;
        }
        .receipt-info {
            padding: 30px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .info-item {
            flex: 1;
        }
        .info-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 14px;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background: #f5f5f5;
            border: 2px solid #000;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
        }
        td {
            border: 2px solid #000;
            padding: 12px;
            font-size: 14px;
        }
        .amount-cell {
            text-align: right;
            font-weight: bold;
        }
        .status-section {
            margin: 30px 0;
            font-size: 18px;
            font-weight: bold;
        }
        .signature-section {
            margin-top: 80px;
            text-align: right;
        }
        .signature-line {
            border-top: 2px solid #000;
            width: 250px;
            margin-left: auto;
            padding-top: 10px;
            text-align: center;
            font-size: 12px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            padding: 20px;
            border-top: 1px solid #ccc;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${teacherData.tuition_name || 'KLASSYAI ACADEMY'}</h1>
            <p>${teacherData.address || 'Mumbai East, Maharashtra'}</p>
            <p>Contact: ${teacherData.phone || '9730859883'} | Email: ${teacherData.email || 'adikashid21@gmail.com'}</p>
        </div>

        <div class="receipt-title">
            <h2>OFFICIAL RECEIPT</h2>
        </div>

        <div class="receipt-info">
            <div class="info-row">
                <div class="info-item">
                    <div class="info-label">Receipt No</div>
                    <div class="info-value">: ${receiptNumber}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Student Name</div>
                    <div class="info-value">: ${studentData.name}</div>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    <div class="info-label">Date</div>
                    <div class="info-value">: ${receiptDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Class/Grade</div>
                    <div class="info-value">: ${studentData.grade || 'N/A'}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>DESCRIPTION</th>
                        <th>PARTICULARS</th>
                        <th style="text-align: right;">AMOUNT (INR)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Tuition Fee</td>
                        <td>Month: ${feeData.month}, Year: ${feeData.year}</td>
                        <td class="amount-cell">${parseFloat(feeData.amount).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td><strong>Amount Paid</strong></td>
                        <td class="amount-cell">${parseFloat(feeData.paid_amount || feeData.amount).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td><strong>Balance Due</strong></td>
                        <td class="amount-cell">${(parseFloat(feeData.amount) - parseFloat(feeData.paid_amount || feeData.amount)).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="status-section">
                <strong>PAYMENT STATUS: ${feeData.status === 'paid' ? 'PAID' : 'PENDING'}</strong>
            </div>

            ${feeData.payment_mode ? `<p style="margin-top: 10px;">Payment Mode: ${feeData.payment_mode}</p>` : ''}

            <div class="signature-section">
                <div class="signature-line">
                    Authorized Signature
                </div>
            </div>

            <div class="footer">
                <p>This is a computer-generated receipt and does not require a signature.</p>
                <p>For any queries, please contact ${teacherData.phone || 'administration'}.</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        const options = {
            html: htmlContent,
            fileName: `FeeReceipt_${studentData.name.replace(/\s+/g, '_')}_${feeData.month}_${feeData.year}`,
            directory: 'Documents',
        };

        const file = await RNHTMLtoPDF.generatePDF(options);
        
        // Move to public Downloads folder for better accessibility
        const destinationPath = `${RNFS.DownloadDirectoryPath}/${options.fileName}.pdf`;
        
        try {
            if (await RNFS.exists(destinationPath)) {
                await RNFS.unlink(destinationPath);
            }
            await RNFS.moveFile(file.filePath, destinationPath);
        } catch (moveError) {
            console.log('Could not move to Downloads, using internal path:', moveError);
        }

        const finalPath = (await RNFS.exists(destinationPath)) ? destinationPath : file.filePath;

        // Show WhatsApp-style notification at top
        const fileName = `Fee Receipt - ${feeData.month} ${feeData.year}`;
        await showDownloadNotification(fileName, finalPath);

        return finalPath;
    } catch (error) {
        __DEV__ && console.log('Error generating receipt:', error);
        Alert.alert('Error', 'Failed to generate receipt: ' + (error as Error).message);
        return null;
    }
};

export const generateMarksheet = async (marksData: any[], studentData: any, teacherData: any) => {
    try {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
            Alert.alert('Permission Denied', 'Storage permission is required');
            return;
        }

        // Calculate stats
        const totalMarks = marksData.reduce((sum, m) => sum + parseFloat(m.score), 0);
        const totalMaxMarks = marksData.reduce((sum, m) => sum + parseFloat(m.max_score), 0);
        const percentage = ((totalMarks / totalMaxMarks) * 100).toFixed(2);
        const grade = parseFloat(percentage) >= 90 ? 'A+' :
            parseFloat(percentage) >= 75 ? 'A' :
                parseFloat(percentage) >= 60 ? 'B' :
                    parseFloat(percentage) >= 50 ? 'C' : 'D';

        const marksRows = marksData.map(mark => `
            <tr>
                <td>${mark.subject}</td>
                <td>${mark.exam_name || 'Test'}</td>
                <td class="center-cell">${mark.max_score}</td>
                <td class="center-cell">${mark.score}</td>
                <td class="center-cell">${((parseFloat(mark.score) / parseFloat(mark.max_score)) * 100).toFixed(1)}%</td>
            </tr>
        `).join('');

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background: white;
        }
        .container {
            border: 3px solid #000;
            padding: 0;
            max-width: 900px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            padding: 30px;
            border-bottom: 3px solid #000;
        }
        .header h1 {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
            letter-spacing: 2px;
        }
        .header p {
            font-size: 14px;
            margin: 5px 0;
        }
        .marksheet-title {
            background: #000;
            color: white;
            padding: 15px;
            text-align: center;
        }
        .marksheet-title h2 {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 3px;
        }
        .content {
            padding: 30px;
        }
        .student-info {
            margin-bottom: 30px;
        }
        .info-row {
            display: flex;
            margin: 10px 0;
            font-size: 14px;
        }
        .info-label {
            width: 150px;
            font-weight: bold;
        }
        .info-value {
            flex: 1;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background: #f0f0f0;
            border: 2px solid #000;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 14px;
        }
        td {
            border: 2px solid #000;
            padding: 12px;
            font-size: 14px;
        }
        .center-cell {
            text-align: center;
        }
        .total-row {
            background: #f5f5f5;
            font-weight: bold;
        }
        .result-section {
            margin: 30px 0;
            padding: 20px;
            background: #f9f9f9;
            border: 2px solid #000;
        }
        .result-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 16px;
        }
        .result-label {
            font-weight: bold;
        }
        .signature-section {
            margin-top: 80px;
            display: flex;
            justify-content: space-between;
        }
        .signature-box {
            text-align: center;
        }
        .signature-line {
            border-top: 2px solid #000;
            width: 200px;
            padding-top: 10px;
            margin-top: 50px;
            font-size: 12px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            padding: 20px;
            border-top: 1px solid #ccc;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${teacherData.tuition_name || 'KLASSYAI ACADEMY'}</h1>
            <p>${teacherData.address || 'Mumbai East, Maharashtra'}</p>
            <p>Contact: ${teacherData.phone || '9730859883'} | Email: ${teacherData.email || 'adikashid21@gmail.com'}</p>
        </div>

        <div class="marksheet-title">
            <h2>STUDENT MARKSHEET</h2>
        </div>

        <div class="content">
            <div class="student-info">
                <h3 style="margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px;">Student Information</h3>
                <div class="info-row">
                    <div class="info-label">Student Name:</div>
                    <div class="info-value">${studentData.name}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Class/Grade:</div>
                    <div class="info-value">${studentData.grade || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Date of Issue:</div>
                    <div class="info-value">${new Date().toLocaleDateString()}</div>
                </div>
            </div>

            <h3 style="margin: 20px 0; border-bottom: 2px solid #000; padding-bottom: 10px;">Academic Performance</h3>

            <table>
                <thead>
                    <tr>
                        <th>SUBJECT</th>
                        <th>EXAMINATION</th>
                        <th class="center-cell">MAX MARKS</th>
                        <th class="center-cell">MARKS OBTAINED</th>
                        <th class="center-cell">PERCENTAGE</th>
                    </tr>
                </thead>
                <tbody>
                    ${marksRows}
                    <tr class="total-row">
                        <td colspan="2">TOTAL</td>
                        <td class="center-cell">${totalMaxMarks}</td>
                        <td class="center-cell">${totalMarks}</td>
                        <td class="center-cell">${percentage}%</td>
                    </tr>
                </tbody>
            </table>

            <div class="result-section">
                <h3 style="text-align: center; margin-bottom: 15px;">FINAL RESULT</h3>
                <div class="result-row">
                    <div class="result-label">Total Marks Obtained:</div>
                    <div>${totalMarks} / ${totalMaxMarks}</div>
                </div>
                <div class="result-row">
                    <div class="result-label">Overall Percentage:</div>
                    <div>${percentage}%</div>
                </div>
                <div class="result-row">
                    <div class="result-label">Grade:</div>
                    <div style="font-size: 24px; font-weight: bold; color: ${grade === 'A+' || grade === 'A' ? '#28a745' : grade === 'B' ? '#ffc107' : '#dc3545'};">${grade}</div>
                </div>
            </div>

            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line">
                        Class Teacher
                    </div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">
                        Principal/Director
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>This is a computer-generated marksheet and does not require a signature.</p>
                <p>For any queries, please contact ${teacherData.phone || 'administration'}.</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        const options = {
            html: htmlContent,
            fileName: `Marksheet_${studentData.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
            directory: 'Documents',
        };

        const file = await RNHTMLtoPDF.generatePDF(options);

        // Move to public Downloads folder
        const destinationPath = `${RNFS.DownloadDirectoryPath}/${options.fileName}.pdf`;

        try {
            if (await RNFS.exists(destinationPath)) {
                await RNFS.unlink(destinationPath);
            }
            await RNFS.moveFile(file.filePath, destinationPath);
        } catch (moveError) {
            console.log('Could not move to Downloads, using internal path:', moveError);
        }

        const finalPath = (await RNFS.exists(destinationPath)) ? destinationPath : file.filePath;

        // Show WhatsApp-style notification at top
        const fileName = `Marksheet - ${studentData.name}`;
        await showDownloadNotification(fileName, finalPath);

        return finalPath;
    } catch (error) {
        __DEV__ && console.log('Error generating marksheet:', error);
        Alert.alert('Error', 'Failed to generate marksheet: ' + (error as Error).message);
        return null;
    }
};

const shareFile = async (filePath: string) => {
    // TODO: Implement file sharing
    // Can use react-native-share package
};
