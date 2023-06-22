import { expect } from '../expect';
import { ProcessEntry } from '../../src/util/processes';
import { SystemInfo } from '../../src/util/processes';
import { Processes } from '../../src/util/processes';
import * as childProcess from 'child_process';
import * as os from "os";
import { Logger, LogLevel } from '../../src/util/logger';
import { merge } from '../../src/util/merge';
import * as Sinon from 'sinon';
import { ImportMock } from 'ts-mock-imports';
import { disableConsole, enableConsole } from '../util';

export const WMIC_OUTPUT = `

Caption=Discord.exe
CommandLine="C:\\Discord\\app-1.0.X\\Discord.exe" --type=renderer
CreationClassName=Win32_Process
CreationDate=20210513105049.093991+120
CSCreationClassName=Win32_ComputerSystem
CSName=TEST
Description=Discord.exe
ExecutablePath=C:\\Discord\\app-1.0.X\\Discord.exe
ExecutionState=
Handle=14300
HandleCount=874
InstallDate=
KernelModeTime=2151093750
MaximumWorkingSetSize=1380
MinimumWorkingSetSize=200
Name=Discord.exe
OSCreationClassName=Win32_OperatingSystem
OSName=Microsoft Windows 10 Pro|C:\\Windows|\\Device\\Harddisk0\\Partition3
OtherOperationCount=1216445
OtherTransferCount=36483076
PageFaults=3105179
PageFileUsage=216140
ParentProcessId=15476
PeakPageFileUsage=264836
PeakVirtualSize=838643712
PeakWorkingSetSize=248604
Priority=8
PrivatePageCount=221327360
ProcessId=14300
QuotaNonPagedPoolUsage=123
QuotaPagedPoolUsage=743
QuotaPeakNonPagedPoolUsage=136
QuotaPeakPagedPoolUsage=881
ReadOperationCount=36293
ReadTransferCount=66002197
SessionId=1
Status=
TerminationDate=
ThreadCount=38
UserModeTime=1351406250
VirtualSize=757694464
WindowsVersion=10.0.19042
WorkingSetSize=181981184
WriteOperationCount=30428
WriteTransferCount=77941777


Caption=Discord.exe
CommandLine="C:\\Discord\\app-1.0.X\\Discord.exe" --type=utility
CreationClassName=Win32_Process
CreationDate=20210513105056.678847+120
CSCreationClassName=Win32_ComputerSystem
CSName=TEST
Description=Discord.exe
ExecutablePath=C:\\Discord\\app-1.0.X\\Discord.exe
ExecutionState=
Handle=3288
HandleCount=306
InstallDate=
KernelModeTime=1562500
MaximumWorkingSetSize=1380
MinimumWorkingSetSize=200
Name=Discord.exe
OSCreationClassName=Win32_OperatingSystem
OSName=Microsoft Windows 10 Pro|C:\\Windows|\\Device\\Harddisk0\\Partition3
OtherOperationCount=546
OtherTransferCount=12300
PageFaults=17397
PageFileUsage=13368
ParentProcessId=15476
PeakPageFileUsage=13608
PeakVirtualSize=294477824
PeakWorkingSetSize=59056
Priority=8
PrivatePageCount=13688832
ProcessId=3288
QuotaNonPagedPoolUsage=24
QuotaPagedPoolUsage=408
QuotaPeakNonPagedPoolUsage=26
QuotaPeakPagedPoolUsage=410
ReadOperationCount=545
ReadTransferCount=11260
SessionId=1
Status=
TerminationDate=
ThreadCount=8
UserModeTime=2187500
VirtualSize=290512896
WindowsVersion=10.0.X
WorkingSetSize=59183104
WriteOperationCount=612
WriteTransferCount=20544
`;

describe('Test class ProcessEntry', () => {

    it('ProcessEntry-Name', () => {
        const name1 = 'Oha';
        const processId1 = 'Oha';
        const executablePath1 = 'Oha';
        const privatePageCount1 = 'Oha';
        const creationDate1 = 'Oha';
        const userModeTime1 = 'Oha';
        const kernelModeTime1 = 'Oha';

        const processEntry = new ProcessEntry();
        processEntry.Name = name1;
        processEntry.ProcessId = processId1;
        processEntry.ExecutablePath = executablePath1;
        processEntry.PrivatePageCount = privatePageCount1;
        processEntry.CreationDate = creationDate1;
        processEntry.UserModeTime = userModeTime1;
        processEntry.KernelModeTime = kernelModeTime1;
        
        expect(processEntry.Name).equals(name1);
        expect(processEntry.ProcessId).equals(processId1);
        expect(processEntry.ExecutablePath).equals(executablePath1);
        expect(processEntry.PrivatePageCount).equals(privatePageCount1);
        expect(processEntry.CreationDate).equals(creationDate1);
        expect(processEntry.UserModeTime).equals(userModeTime1);
        expect(processEntry.KernelModeTime).equals(kernelModeTime1);
    });

});

describe('Test class SystemInfo', () => {

    it('SystemInfo-cpu', () => {
        const cpu1 = undefined;
        const avgLoad1 = undefined;
        const memTotal1 = 10;
        const memFree1 = 10;
        const uptime1 = 10;

        // Property call
        const systemInfo = new SystemInfo();
        systemInfo.cpu = cpu1!;
        systemInfo.avgLoad = avgLoad1!;
        systemInfo.memTotal = memTotal1;
        systemInfo.memFree = memFree1;
        systemInfo.uptime = uptime1;
        
        expect(systemInfo.cpu).equals(cpu1);
        expect(systemInfo.avgLoad).equals(avgLoad1);
        expect(systemInfo.memTotal).equals(memTotal1);
        expect(systemInfo.memFree).equals(memFree1);
        expect(systemInfo.uptime).equals(uptime1);

    });

});

describe('Test class Processes', () => {

    before(() => {
        disableConsole();
    });

    after(() => {
        enableConsole();
    });

    beforeEach(() => {
        // restore mocks
        ImportMock.restore();
    });

    it('Processes-getProcessList', async () => {
        const processes = new Processes();

        processes['windowsProcessFetcher']['spawner']
            .spawnForOutput = async () => ({
                status: 0,
                stdout: WMIC_OUTPUT,
                stderr: '',
            });

        const result = await processes.getProcessList('C:\\Discord\\app-1.0.X\\Discord.exe');

        // Expect result
        expect(result.length).to.equal(2);
        expect(result[0].ProcessId).to.equal('14300');
        expect(result[0].ExecutablePath).to.equal('C:\\Discord\\app-1.0.X\\Discord.exe');

        const spent = (2151093750 + 1351406250) / 10000;
        expect(processes.getProcessCPUSpent(result[0])).to.equal(spent);

        Sinon.stub(processes, 'getProcessUptime').returns(
            spent * 10
        );

        expect(processes.getProcessCPUUsage(result[0])).to.equal(
            Math.round(
                10 / Math.max(os.cpus().length, 1)
            )
        );

        expect(processes.getProcessCPUUsage(result[0], result[0])).to.equal(0);
    });

    it('Processes-killProcess', async () => {
        const processes = new Processes();
        
        const spawnMock = ImportMock.mockFunction(childProcess, 'spawn').returns({
            on: (t, r) => {
                r();
            },
        });
        
        const pid = 'abdfsdfsdf1234######';

        await processes.killProcess(pid);

        expect(spawnMock.callCount).to.equal(1);
        expect(spawnMock.firstCall.args[1]).to.include(pid);
    });

    it('Processes-killProcess', () => {
        const processes = new Processes();
        
        const spawnMock = ImportMock.mockFunction(childProcess, 'spawn').returns({
            on: (t, r) => {
                r('error :)');
            },
        });
        
        const pid = 'abdfsdfsdf1234######';

        expect(processes.killProcess(pid)).to.be.rejected;
    });

    it('Processes-getSystemUsage', () => {
        const processes = new Processes();
        const result = processes.getSystemUsage();

        expect(result).to.be.not.undefined;
        expect(result.avgLoad).to.be.not.undefined;
        expect(result.cpu).to.be.not.undefined;
        expect(result.memFree).to.be.not.undefined;
        expect(result.memTotal).to.be.not.undefined;
        expect(result.uptime).to.be.not.undefined;
    });

    it('Processes-spawnForOutput-fail', async () => {
        const processes = new Processes();
        const resultErr = await processes.spawnForOutput(
            'node',
            [
                '-e',
                'console.error(\'TestError\'); process.exit(123)'
            ],
            {
                dontThrow: true,
            }
        );
        expect(resultErr.status).to.equal(123);
        expect(resultErr.stderr).to.equal('TestError\n');
    });

    it('Processes-spawnForOutput-throw', async () => {
        const processes = new Processes();
        expect(processes.spawnForOutput(
            'node',
            [
                '-e',
                'console.error(\'TestError\'); process.exit(123)'
            ]
        )).to.be.rejected;
    });

    it('Processes-spawnForOutput', async () => {
        const processes = new Processes();
        
        let handlerStdout = '';
        let handlerStderr = '';
        const result = await processes.spawnForOutput(
            'node',
            [
                '-e',
                'console.log(\'TestLog\')'
            ],
            {
                stdErrHandler: (data) => {
                    handlerStderr += data;
                },
                stdOutHandler: (data) => {
                    handlerStdout += data;
                },
                verbose: true,
            }
        );

        expect(result.status).to.equal(0);
        expect(result.stdout).to.equal('TestLog\n');
        expect(handlerStdout).to.equal('TestLog\n');
        expect(handlerStderr).to.equal('');
    });

});
