using System;
using System.Threading.Tasks;
using Microsoft.Azure.NotificationHubs;
using Newtonsoft.Json;

public static void Run(string mySbMsg, out Notification notification, TraceWriter log)
{
    dynamic jsonMsg;
    string msg;
    log.Info($"C# Queue trigger function processed: {mySbMsg}");
    if(mySbMsg.ToLower().Contains("threshold_acceleration"))
    {
        jsonMsg = JsonConvert.DeserializeObject(mySbMsg);
        msg = "Device: " + jsonMsg.device + "\nProlonged Vibration Alert: " + jsonMsg.avg_acceleration + " Exceeds Threshold: " + jsonMsg.threshold_acceleration;

    }
    else
    {
        msg = "Empty Message";
    }
    string toastPayload = "<toast><visual><binding template=\"ToastText01\"><text id=\"1\">" + msg + "</text></binding></visual></toast>";
    notification = new WindowsNotification(toastPayload);
}

//position, prevposition, device, time