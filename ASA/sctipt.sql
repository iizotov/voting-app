WITH 
filler AS (
    SELECT 
        System.Timestamp AS dt,
        TopOne() OVER (ORDER BY EventProcessedUtcTime DESC) AS lastEvent
    FROM
        voteInput
    GROUP BY HOPPINGWINDOW(second, 3600, 1),
        IoTHub.ConnectionDeviceId
),

flat AS (
    SELECT 
        lastEvent.vote as vote,
        lastEvent.IoTHub.ConnectionDeviceId as voter,
        dt
    FROM
        filler
),

freq AS (
SELECT 
    COUNT(*) / 5 as vote_frequency,
    System.Timestamp AS dt,
    IoTHub.ConnectionDeviceId as voter
FROM
    voteInput
GROUP BY
    HOPPINGWINDOW(second, 5, 1),
    IoTHub.ConnectionDeviceId
)


SELECT
    vote,
    dt,
    voter
INTO
    [pbiRawOutput]
FROM
    flat;

SELECT
    vote,
    dt,
    voter
INTO
    [tblRawOutput]
FROM
    flat;

SELECT
    AVG(vote) AS average_vote,
    System.Timestamp AS dt
INTO
    [pbiAvgOutput]
FROM
    flat
GROUP BY
    HOPPINGWINDOW(second, 10, 1);

select *
into 
    pbiFreqOutput
from 
    freq;

