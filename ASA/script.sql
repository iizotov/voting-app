/* Data Prep: Basic Type Transformation & Cleansing */
WITH [Cleansed Input] AS (
    SELECT
        System.Timestamp AS dt,
        device,
        AVG(TRY_CAST(vote as float)) as acceleration
    FROM
        [voteInput]
    GROUP BY
        device, TumblingWindow(ms, 300) 
),
/* Data Prep: Short Averages Using a 5-sec Hopping Window */
[Short Averages] AS (
    SELECT
        System.Timestamp AS dt,
        device,
        5.0 as Threshold_Acceleration,
        AVG(TRY_CAST(vote as float)) as avg_acceleration
    FROM
        [voteInput]
    GROUP BY
        device, HoppingWindow(ms, 10000, 500) 
),
/* Data Prep: Long Averages Using a 5-sec Tubmling Window */
[Alert Prep] AS (
    SELECT
        dt,
        device,
        Threshold_Acceleration,
        avg_acceleration
    FROM
        [Short Averages]
    WHERE
        ABS(avg_acceleration) >= Threshold_Acceleration
)

/* Data Archival: Raw Unmodified Input to Blob Storage for Archival */
SELECT
    *
    INTO [blobOutput]
    FROM [voteInput];

/* Data Output: Raw Unmodified Input to DocDB for Querying */
SELECT
    CONCAT(TRY_CAST(EVENTENQUEUEDUTCTIME as nvarchar(max)), '-', device) as id,
    *
    INTO [docDBOutput]
    FROM [voteInput];

/* Data Output: Cleansed Data to Power BI */
SELECT
    acceleration,
    dt,
    device
INTO
    [pbiRawOutput]
FROM
    [Cleansed Input];

/* Data Output: Short Averages to Power BI */
SELECT
    avg_acceleration,
    dt,
    device
INTO
    [pbiAvgOutput]
FROM
    [Short Averages];

/* Data Output: Cleansed Data to SQL DB */
SELECT
    device,
    dt,
    acceleration
    INTO [sqlDbOutput]
    FROM [Cleansed Input];

/* Data Output: Notifications */
SELECT
    device,
    MAX(Threshold_Acceleration) as Threshold_Acceleration,
    MAX(avg_acceleration) as avg_acceleration
INTO 
    [notification-output]
FROM
    [Alert Prep]
GROUP BY device, TumblingWindow(ss, 5);