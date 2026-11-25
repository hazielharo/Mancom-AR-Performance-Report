import { ARReportData } from "../types/arReport";

// Derived directly from fixtures/AR_MONITORING_FOR_APPSHEET.csv
export const BASELINE_AR_DATA: ARReportData = {
  "title": "Mancom & Leadership Performance Update",
  "subtitle": "YTD October Billing & Collection Efficiency",
  "lastUpdated": "11/20/2026 1:40:56 PM",
  "defaultTargetBenchmark": 90,
  "priorMonthEfficiency": 73,
  "ytdSepBilling": 461161161.32,
  "ytdSepCollections": 373566251.53,
  "octArBilling": 59136376.39,
  "octArCollections": 26328481.52,
  "recoveryFlows": {
    "oct1To31SepAr": 26338911.02,
    "nov1To9SepAr": 8139856.21,
    "collectionOctAr": 35253438.33
  },
  "sourceFormat": "appsheet",
  "sourceRowCount": 2026,
  "sourceActiveRowCount": 1839,
  "focusMonthLabel": "October 2026",
  "breakdowns": {
    "all": {
      "byCategory": [
        {
          "name": "AAPMI",
          "count": 1333,
          "billed": 359415803.17,
          "collections": 274577551.61,
          "balance": 84838251.56,
          "efficiency": 76.4
        },
        {
          "name": "OTHERS",
          "count": 171,
          "billed": 73131165.83,
          "collections": 63797825.41,
          "balance": 9333340.42,
          "efficiency": 87.24
        },
        {
          "name": "MREIT",
          "count": 167,
          "billed": 63959725.6,
          "collections": 43206193.95,
          "balance": 20753531.65,
          "efficiency": 67.55
        },
        {
          "name": "FOPM",
          "count": 51,
          "billed": 14821450.75,
          "collections": 13074465.92,
          "balance": 1746984.83,
          "efficiency": 88.21
        },
        {
          "name": "MEG",
          "count": 56,
          "billed": 4675899.05,
          "collections": 3661244.82,
          "balance": 1014654.23,
          "efficiency": 78.3
        },
        {
          "name": "MEG SHOWROOM",
          "count": 61,
          "billed": 4293493.31,
          "collections": 1577451.34,
          "balance": 2716041.97,
          "efficiency": 36.74
        }
      ],
      "byAging": [
        {
          "name": "Current",
          "count": 11,
          "billed": 9045956.79,
          "collections": 9045956.81,
          "balance": -0.02,
          "efficiency": 100
        },
        {
          "name": "1-30 days",
          "count": 203,
          "billed": 59136376.39,
          "collections": 26328481.52,
          "balance": 32807894.87,
          "efficiency": 44.52
        },
        {
          "name": "31-60 days",
          "count": 143,
          "billed": 47006745.08,
          "collections": 27279414.58,
          "balance": 19727330.5,
          "efficiency": 58.03
        },
        {
          "name": "61-90 days",
          "count": 158,
          "billed": 64763953.05,
          "collections": 46545244.65,
          "balance": 18218708.4,
          "efficiency": 71.87
        },
        {
          "name": "91 days above",
          "count": 1324,
          "billed": 340344506.4,
          "collections": 290695635.49,
          "balance": 49648870.91,
          "efficiency": 85.41
        }
      ],
      "byAreaManager": [
        {
          "name": "CEZAR",
          "count": 225,
          "billed": 108383191.48,
          "collections": 100065482.55,
          "balance": 8317708.93,
          "efficiency": 92.33
        },
        {
          "name": "KING",
          "count": 147,
          "billed": 73752798.6,
          "collections": 63689274.66,
          "balance": 10063523.94,
          "efficiency": 86.36
        },
        {
          "name": "ROWENA",
          "count": 259,
          "billed": 60734234.37,
          "collections": 47654211.67,
          "balance": 13080022.7,
          "efficiency": 78.46
        },
        {
          "name": "RALPH",
          "count": 160,
          "billed": 60273344.05,
          "collections": 40092985.95,
          "balance": 20180358.1,
          "efficiency": 66.52
        },
        {
          "name": "HARVEY",
          "count": 238,
          "billed": 54116605.23,
          "collections": 34578233.01,
          "balance": 19538372.22,
          "efficiency": 63.9
        },
        {
          "name": "JANINE",
          "count": 217,
          "billed": 52236745.62,
          "collections": 40688404.88,
          "balance": 11548340.74,
          "efficiency": 77.89
        },
        {
          "name": "ANGIE",
          "count": 188,
          "billed": 49731907.89,
          "collections": 36117958.38,
          "balance": 13613949.51,
          "efficiency": 72.63
        },
        {
          "name": "LYKA",
          "count": 203,
          "billed": 30873953.29,
          "collections": 15903839.78,
          "balance": 14970113.51,
          "efficiency": 51.51
        },
        {
          "name": "NORIEL",
          "count": 196,
          "billed": 27081549.18,
          "collections": 17991134.17,
          "balance": 9090415.01,
          "efficiency": 66.43
        },
        {
          "name": "SANDHER",
          "count": 6,
          "billed": 3113208,
          "collections": 3113208,
          "balance": 0,
          "efficiency": 100
        }
      ]
    },
    "ytd_sep": {
      "byCategory": [
        {
          "name": "AAPMI",
          "count": 1190,
          "billed": 315831954.61,
          "collections": 255030197.71,
          "balance": 60801756.9,
          "efficiency": 80.75
        },
        {
          "name": "OTHERS",
          "count": 143,
          "billed": 64735184.87,
          "collections": 57016697.79,
          "balance": 7718487.08,
          "efficiency": 88.08
        },
        {
          "name": "MREIT",
          "count": 143,
          "billed": 57270789.23,
          "collections": 43206193.95,
          "balance": 14064595.28,
          "efficiency": 75.44
        },
        {
          "name": "FOPM",
          "count": 51,
          "billed": 14821450.75,
          "collections": 13074465.92,
          "balance": 1746984.83,
          "efficiency": 88.21
        },
        {
          "name": "MEG",
          "count": 56,
          "billed": 4675899.05,
          "collections": 3661244.82,
          "balance": 1014654.23,
          "efficiency": 78.3
        },
        {
          "name": "MEG SHOWROOM",
          "count": 53,
          "billed": 3825882.81,
          "collections": 1577451.34,
          "balance": 2248431.47,
          "efficiency": 41.23
        }
      ],
      "byAging": [
        {
          "name": "Current",
          "count": 11,
          "billed": 9045956.79,
          "collections": 9045956.81,
          "balance": -0.02,
          "efficiency": 100
        },
        {
          "name": "31-60 days",
          "count": 143,
          "billed": 47006745.08,
          "collections": 27279414.58,
          "balance": 19727330.5,
          "efficiency": 58.03
        },
        {
          "name": "61-90 days",
          "count": 158,
          "billed": 64763953.05,
          "collections": 46545244.65,
          "balance": 18218708.4,
          "efficiency": 71.87
        },
        {
          "name": "91 days above",
          "count": 1324,
          "billed": 340344506.4,
          "collections": 290695635.49,
          "balance": 49648870.91,
          "efficiency": 85.41
        }
      ],
      "byAreaManager": [
        {
          "name": "CEZAR",
          "count": 197,
          "billed": 95587497.02,
          "collections": 90059843.52,
          "balance": 5527653.5,
          "efficiency": 94.22
        },
        {
          "name": "KING",
          "count": 129,
          "billed": 66108195.64,
          "collections": 56935811.04,
          "balance": 9172384.6,
          "efficiency": 86.13
        },
        {
          "name": "RALPH",
          "count": 138,
          "billed": 54252718.43,
          "collections": 40092985.95,
          "balance": 14159732.48,
          "efficiency": 73.9
        },
        {
          "name": "ROWENA",
          "count": 233,
          "billed": 52980924.41,
          "collections": 44440623.01,
          "balance": 8540301.4,
          "efficiency": 83.88
        },
        {
          "name": "HARVEY",
          "count": 224,
          "billed": 49137497.23,
          "collections": 33121976.58,
          "balance": 16015520.65,
          "efficiency": 67.41
        },
        {
          "name": "ANGIE",
          "count": 167,
          "billed": 44484928.15,
          "collections": 34379082.26,
          "balance": 10105845.89,
          "efficiency": 77.28
        },
        {
          "name": "JANINE",
          "count": 181,
          "billed": 42959993.8,
          "collections": 39084655.36,
          "balance": 3875338.44,
          "efficiency": 90.98
        },
        {
          "name": "LYKA",
          "count": 179,
          "billed": 27195605.8,
          "collections": 15346000.51,
          "balance": 11849605.29,
          "efficiency": 56.43
        },
        {
          "name": "NORIEL",
          "count": 182,
          "billed": 25340592.84,
          "collections": 16992065.3,
          "balance": 8348527.54,
          "efficiency": 67.05
        },
        {
          "name": "SANDHER",
          "count": 6,
          "billed": 3113208,
          "collections": 3113208,
          "balance": 0,
          "efficiency": 100
        }
      ]
    },
    "oct_ar": {
      "byCategory": [
        {
          "name": "AAPMI",
          "count": 143,
          "billed": 43583848.56,
          "collections": 19547353.9,
          "balance": 24036494.66,
          "efficiency": 44.85
        },
        {
          "name": "OTHERS",
          "count": 28,
          "billed": 8395980.96,
          "collections": 6781127.62,
          "balance": 1614853.34,
          "efficiency": 80.77
        },
        {
          "name": "MREIT",
          "count": 24,
          "billed": 6688936.37,
          "collections": 0,
          "balance": 6688936.37,
          "efficiency": 0
        },
        {
          "name": "MEG SHOWROOM",
          "count": 8,
          "billed": 467610.5,
          "collections": 0,
          "balance": 467610.5,
          "efficiency": 0
        }
      ],
      "byAging": [
        {
          "name": "1-30 days",
          "count": 203,
          "billed": 59136376.39,
          "collections": 26328481.52,
          "balance": 32807894.87,
          "efficiency": 44.52
        }
      ],
      "byAreaManager": [
        {
          "name": "CEZAR",
          "count": 28,
          "billed": 12795694.46,
          "collections": 10005639.03,
          "balance": 2790055.43,
          "efficiency": 78.2
        },
        {
          "name": "JANINE",
          "count": 36,
          "billed": 9276751.82,
          "collections": 1603749.52,
          "balance": 7673002.3,
          "efficiency": 17.29
        },
        {
          "name": "ROWENA",
          "count": 26,
          "billed": 7753309.96,
          "collections": 3213588.66,
          "balance": 4539721.3,
          "efficiency": 41.45
        },
        {
          "name": "KING",
          "count": 18,
          "billed": 7644602.96,
          "collections": 6753463.62,
          "balance": 891139.34,
          "efficiency": 88.34
        },
        {
          "name": "RALPH",
          "count": 22,
          "billed": 6020625.62,
          "collections": 0,
          "balance": 6020625.62,
          "efficiency": 0
        },
        {
          "name": "ANGIE",
          "count": 21,
          "billed": 5246979.74,
          "collections": 1738876.12,
          "balance": 3508103.62,
          "efficiency": 33.14
        },
        {
          "name": "HARVEY",
          "count": 14,
          "billed": 4979108,
          "collections": 1456256.43,
          "balance": 3522851.57,
          "efficiency": 29.25
        },
        {
          "name": "LYKA",
          "count": 24,
          "billed": 3678347.49,
          "collections": 557839.27,
          "balance": 3120508.22,
          "efficiency": 15.17
        },
        {
          "name": "NORIEL",
          "count": 14,
          "billed": 1740956.34,
          "collections": 999068.87,
          "balance": 741887.47,
          "efficiency": 57.39
        }
      ]
    }
  },
  "managerSummaries": [
    {
      "manager": "LYKA",
      "mancom": "LTM",
      "ytdAugBilled": 23611991.23,
      "ytdAugCollected": 13338000.9,
      "ytdAugOpen": 12842458.52,
      "sepBilled": 3583614.57,
      "sepCollected": 2007999.61,
      "sepOpen": 3485617.91,
      "ytdSepPreOctOpen": 16328076.43,
      "oct1To31SepColl": 2585210.23,
      "nov1To9SepColl": 1893260.91,
      "totalSepRecoveryColl": 4478471.14,
      "ytdSepRemainingOpen": 11849605.29,
      "octBilled": 3678347.49,
      "octCollected": 557839.27,
      "octOpen": 3120508.22,
      "novBilled": 0,
      "novCollected": 0,
      "novOpen": 0,
      "totalBilled": 30873953.29,
      "totalCollected": 15903839.78,
      "totalRemaining": 14970113.51,
      "agingCurrent": 0,
      "aging1To30": 3120508.22,
      "aging31To60": 1575614.96,
      "aging61To90": 1077470.6,
      "aging91Above": 9196519.73
    },
    {
      "manager": "JANINE",
      "mancom": "LTM",
      "ytdAugBilled": 39127267.98,
      "ytdAugCollected": 36310811.49,
      "ytdAugOpen": 5154865.98,
      "sepBilled": 3832725.82,
      "sepCollected": 2773843.87,
      "sepOpen": 3660881.29,
      "ytdSepPreOctOpen": 8815747.27,
      "oct1To31SepColl": 4366044.63,
      "nov1To9SepColl": 574364.2,
      "totalSepRecoveryColl": 4940408.83,
      "ytdSepRemainingOpen": 3875338.44,
      "octBilled": 9276751.82,
      "octCollected": 1603749.52,
      "octOpen": 7673002.3,
      "novBilled": 0,
      "novCollected": 0,
      "novOpen": 0,
      "totalBilled": 52236745.62,
      "totalCollected": 40688404.88,
      "totalRemaining": 11548340.74,
      "agingCurrent": 0,
      "aging1To30": 7673002.3,
      "aging31To60": 1058881.95,
      "aging61To90": 521215.79,
      "aging91Above": 2295240.7
    },
    {
      "manager": "CEZAR",
      "mancom": "LTM",
      "ytdAugBilled": 87205785.71,
      "ytdAugCollected": 85209553.79,
      "ytdAugOpen": 5070872.97,
      "sepBilled": 8381711.31,
      "sepCollected": 4850289.73,
      "sepOpen": 6596112.26,
      "ytdSepPreOctOpen": 11666985.23,
      "oct1To31SepColl": 4516767.1,
      "nov1To9SepColl": 1622564.63,
      "totalSepRecoveryColl": 6139331.73,
      "ytdSepRemainingOpen": 5527653.5,
      "octBilled": 12795694.46,
      "octCollected": 10005639.03,
      "octOpen": 2790055.43,
      "novBilled": 0,
      "novCollected": 0,
      "novOpen": 0,
      "totalBilled": 108383191.48,
      "totalCollected": 100065482.55,
      "totalRemaining": 8317708.93,
      "agingCurrent": 0,
      "aging1To30": 2790055.43,
      "aging31To60": 3531421.58,
      "aging61To90": 1177745.32,
      "aging91Above": 818486.6
    },
    {
      "manager": "ROWENA",
      "mancom": "JOVEN",
      "ytdAugBilled": 47203384.74,
      "ytdAugCollected": 40586688.3,
      "ytdAugOpen": 10504549.89,
      "sepBilled": 4576816.33,
      "sepCollected": 2653211.37,
      "sepOpen": 4049431.47,
      "ytdSepPreOctOpen": 14553981.36,
      "oct1To31SepColl": 5286827.08,
      "nov1To9SepColl": 726852.88,
      "totalSepRecoveryColl": 6013679.96,
      "ytdSepRemainingOpen": 8540301.4,
      "octBilled": 7753309.96,
      "octCollected": 3213588.66,
      "octOpen": 4539721.3,
      "novBilled": 1200723.34,
      "novCollected": 1200723.34,
      "novOpen": 0,
      "totalBilled": 60734234.37,
      "totalCollected": 47654211.67,
      "totalRemaining": 13080022.7,
      "agingCurrent": 0,
      "aging1To30": 4539721.3,
      "aging31To60": 1923604.96,
      "aging61To90": 1798014.75,
      "aging91Above": 4818681.69
    },
    {
      "manager": "NORIEL",
      "mancom": "JOVEN",
      "ytdAugBilled": 24224778.27,
      "ytdAugCollected": 16754401.3,
      "ytdAugOpen": 8246648.39,
      "sepBilled": 1115814.57,
      "sepCollected": 237664,
      "sepOpen": 1102150.57,
      "ytdSepPreOctOpen": 9348798.96,
      "oct1To31SepColl": 1000271.42,
      "nov1To9SepColl": 0,
      "totalSepRecoveryColl": 1000271.42,
      "ytdSepRemainingOpen": 8348527.54,
      "octBilled": 1740956.34,
      "octCollected": 999068.87,
      "octOpen": 741887.47,
      "novBilled": 0,
      "novCollected": 0,
      "novOpen": 0,
      "totalBilled": 27081549.18,
      "totalCollected": 17991134.17,
      "totalRemaining": 9090415.01,
      "agingCurrent": 0,
      "aging1To30": 741887.47,
      "aging31To60": 878150.57,
      "aging61To90": 714407.06,
      "aging91Above": 6755969.91
    },
    {
      "manager": "HARVEY",
      "mancom": "ACC",
      "ytdAugBilled": 44755989.19,
      "ytdAugCollected": 30703382.8,
      "ytdAugOpen": 17916143.61,
      "sepBilled": 3419252.65,
      "sepCollected": 1456338.39,
      "sepOpen": 2456997.26,
      "ytdSepPreOctOpen": 20373140.87,
      "oct1To31SepColl": 2789044.28,
      "nov1To9SepColl": 1568575.94,
      "totalSepRecoveryColl": 4357620.22,
      "ytdSepRemainingOpen": 16015520.65,
      "octBilled": 4979108,
      "octCollected": 1456256.43,
      "octOpen": 3522851.57,
      "novBilled": 962255.39,
      "novCollected": 962255.39,
      "novOpen": 0,
      "totalBilled": 54116605.23,
      "totalCollected": 34578233.01,
      "totalRemaining": 19538372.22,
      "agingCurrent": 0,
      "aging1To30": 3522851.57,
      "aging31To60": 1962914.26,
      "aging61To90": 1788924.2,
      "aging91Above": 12263682.19
    },
    {
      "manager": "RALPH",
      "mancom": "AMB/RBD",
      "ytdAugBilled": 48349741.73,
      "ytdAugCollected": 40092985.95,
      "ytdAugOpen": 11773148.56,
      "sepBilled": 5902976.7,
      "sepCollected": 0,
      "sepOpen": 5902976.7,
      "ytdSepPreOctOpen": 17676125.26,
      "oct1To31SepColl": 2118196.02,
      "nov1To9SepColl": 1398196.76,
      "totalSepRecoveryColl": 3516392.78,
      "ytdSepRemainingOpen": 14159732.48,
      "octBilled": 6020625.62,
      "octCollected": 0,
      "octOpen": 6020625.62,
      "novBilled": 0,
      "novCollected": 0,
      "novOpen": 0,
      "totalBilled": 60273344.05,
      "totalCollected": 40092985.95,
      "totalRemaining": 20180358.1,
      "agingCurrent": 0,
      "aging1To30": 6020625.62,
      "aging31To60": 5902976.7,
      "aging61To90": 4648330.02,
      "aging91Above": 3608425.76
    },
    {
      "manager": "ANGIE",
      "mancom": "GHIE",
      "ytdAugBilled": 40208966.04,
      "ytdAugCollected": 31777477.48,
      "ytdAugOpen": 9640002.75,
      "sepBilled": 3708984.05,
      "sepCollected": 2034626.72,
      "sepOpen": 2118042.99,
      "ytdSepPreOctOpen": 11758045.74,
      "oct1To31SepColl": 1652199.85,
      "nov1To9SepColl": 0,
      "totalSepRecoveryColl": 1652199.85,
      "ytdSepRemainingOpen": 10105845.89,
      "octBilled": 5246979.74,
      "octCollected": 1738876.12,
      "octOpen": 3508103.62,
      "novBilled": 566978.06,
      "novCollected": 566978.06,
      "novOpen": 0,
      "totalBilled": 49731907.89,
      "totalCollected": 36117958.38,
      "totalRemaining": 13613949.51,
      "agingCurrent": 0,
      "aging1To30": 3508103.62,
      "aging31To60": 1674357.33,
      "aging61To90": 662294.65,
      "aging91Above": 7769193.91
    },
    {
      "manager": "KING",
      "mancom": "RBD",
      "ytdAugBilled": 47307346.56,
      "ytdAugCollected": 39354370.13,
      "ytdAugOpen": 8750326.84,
      "sepBilled": 12484849.08,
      "sepCollected": 11265440.89,
      "sepOpen": 2802449.08,
      "ytdSepPreOctOpen": 11552775.92,
      "oct1To31SepColl": 2024350.41,
      "nov1To9SepColl": 356040.89,
      "totalSepRecoveryColl": 2380391.3,
      "ytdSepRemainingOpen": 9172384.62,
      "octBilled": 7644602.96,
      "octCollected": 6753463.62,
      "octOpen": 891139.34,
      "novBilled": 6316000,
      "novCollected": 6316000.02,
      "novOpen": -0.02,
      "totalBilled": 73752798.6,
      "totalCollected": 63689274.66,
      "totalRemaining": 10063523.94,
      "agingCurrent": -0.02,
      "aging1To30": 891139.34,
      "aging31To60": 1219408.19,
      "aging61To90": 5830306.01,
      "aging91Above": 2122670.42
    },
    {
      "manager": "SANDHER",
      "mancom": "RBD",
      "ytdAugBilled": 3113208,
      "ytdAugCollected": 3113208,
      "ytdAugOpen": 0,
      "sepBilled": 0,
      "sepCollected": 0,
      "sepOpen": 0,
      "ytdSepPreOctOpen": 0,
      "oct1To31SepColl": 0,
      "nov1To9SepColl": 0,
      "totalSepRecoveryColl": 0,
      "ytdSepRemainingOpen": 0,
      "octBilled": 0,
      "octCollected": 0,
      "octOpen": 0,
      "novBilled": 0,
      "novCollected": 0,
      "novOpen": 0,
      "totalBilled": 3113208,
      "totalCollected": 3113208,
      "totalRemaining": 0,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "aging91Above": 0
    }
  ],
  "cohortMatrix": {
    "orMonthColumns": [
      "January 2026",
      "February 2026",
      "March 2026",
      "April 2026",
      "May 2026",
      "June 2026",
      "July 2026",
      "August 2026",
      "September 2026",
      "October 2026",
      "November 2026"
    ],
    "rows": [
      {
        "arTag": "December 2025",
        "billedTarget": 94851022.21,
        "monthlyCollections": {
          "January 2026": 20809906.61,
          "February 2026": 6529077.65,
          "March 2026": 11106196.89,
          "April 2026": 21176215.95,
          "May 2026": 3575426.87,
          "June 2026": 2282189.78,
          "July 2026": 5637121.74,
          "August 2026": 3730095.17,
          "September 2026": 2376561.59,
          "October 2026": 1181280,
          "November 2026": 1218628.15
        },
        "totalCollection": 79622700.4,
        "remainingBalance": 15228321.81,
        "effPerTargetPct": 83.95,
        "ytdCumEffPct": 83.95
      },
      {
        "arTag": "January 2026",
        "billedTarget": 42610898.86,
        "monthlyCollections": {
          "January 2026": 17299696.4,
          "February 2026": 8304294.66,
          "March 2026": 4778111.37,
          "April 2026": 3787658.14,
          "May 2026": 1235508.6,
          "June 2026": 1060023.88,
          "July 2026": 909444.83,
          "August 2026": 1021978.99,
          "September 2026": 1177868,
          "October 2026": 439826.1,
          "November 2026": 281316.38
        },
        "totalCollection": 40295727.35,
        "remainingBalance": 2315171.51,
        "effPerTargetPct": 94.57,
        "ytdCumEffPct": 87.24
      },
      {
        "arTag": "February 2026",
        "billedTarget": 31817619.39,
        "monthlyCollections": {
          "January 2026": 0,
          "February 2026": 11567374.95,
          "March 2026": 4040095.43,
          "April 2026": 2787898.87,
          "May 2026": 4140222.57,
          "June 2026": 526987.94,
          "July 2026": 901007.36,
          "August 2026": 566590.54,
          "September 2026": 3272573.7,
          "October 2026": 1365894.21,
          "November 2026": 281316.38
        },
        "totalCollection": 29449961.95,
        "remainingBalance": 2367657.44,
        "effPerTargetPct": 92.56,
        "ytdCumEffPct": 88.24
      },
      {
        "arTag": "March 2026",
        "billedTarget": 30658127.85,
        "monthlyCollections": {
          "January 2026": 0,
          "February 2026": 0,
          "March 2026": 7314036.81,
          "April 2026": 4723547.22,
          "May 2026": 3334926.35,
          "June 2026": 731572.62,
          "July 2026": 6245567.2,
          "August 2026": 1103695.1,
          "September 2026": 802727.86,
          "October 2026": 1342615.78,
          "November 2026": 384626.3
        },
        "totalCollection": 25983315.24,
        "remainingBalance": 4674812.61,
        "effPerTargetPct": 84.75,
        "ytdCumEffPct": 87.7
      },
      {
        "arTag": "April 2026",
        "billedTarget": 29483267.94,
        "monthlyCollections": {
          "January 2026": 0,
          "February 2026": 0,
          "March 2026": 0,
          "April 2026": 8049945.88,
          "May 2026": 8294855.83,
          "June 2026": 4813465.65,
          "July 2026": 1360322.03,
          "August 2026": 478159.9,
          "September 2026": 1495838.3,
          "October 2026": 979252.84,
          "November 2026": 700944.68
        },
        "totalCollection": 26172785.11,
        "remainingBalance": 3310482.83,
        "effPerTargetPct": 88.77,
        "ytdCumEffPct": 87.84
      },
      {
        "arTag": "May 2026",
        "billedTarget": 32893317.04,
        "monthlyCollections": {
          "January 2026": 0,
          "February 2026": 0,
          "March 2026": 0,
          "April 2026": 0,
          "May 2026": 13446743.56,
          "June 2026": 5044698.78,
          "July 2026": 3698380.92,
          "August 2026": 941184.02,
          "September 2026": 2695636.15,
          "October 2026": 1805641.24,
          "November 2026": 575117.86
        },
        "totalCollection": 28207402.53,
        "remainingBalance": 4685914.51,
        "effPerTargetPct": 85.75,
        "ytdCumEffPct": 87.58
      },
      {
        "arTag": "June 2026",
        "billedTarget": 42634435.54,
        "monthlyCollections": {
          "January 2026": 0,
          "February 2026": 0,
          "March 2026": 0,
          "April 2026": 0,
          "May 2026": 0,
          "June 2026": 12096503.14,
          "July 2026": 14546925.63,
          "August 2026": 3893630.9,
          "September 2026": 2006055.37,
          "October 2026": 1268304.39,
          "November 2026": 1154604.76
        },
        "totalCollection": 34966024.19,
        "remainingBalance": 7668411.35,
        "effPerTargetPct": 82.01,
        "ytdCumEffPct": 86.8
      },
      {
        "arTag": "July 2026",
        "billedTarget": 35395817.57,
        "monthlyCollections": {
          "January 2026": 0,
          "February 2026": 0,
          "March 2026": 0,
          "April 2026": 0,
          "May 2026": 0,
          "June 2026": 0,
          "July 2026": 9435301.22,
          "August 2026": 7795825.63,
          "September 2026": 6197856.45,
          "October 2026": 1940399.43,
          "November 2026": 628335.99
        },
        "totalCollection": 25997718.72,
        "remainingBalance": 9398098.85,
        "effPerTargetPct": 73.45,
        "ytdCumEffPct": 85.41
      },
      {
        "arTag": "August 2026",
        "billedTarget": 64763953.05,
        "monthlyCollections": {
          "January 2026": 0,
          "February 2026": 0,
          "March 2026": 0,
          "April 2026": 0,
          "May 2026": 0,
          "June 2026": 0,
          "July 2026": 0,
          "August 2026": 11174342.06,
          "September 2026": 28887568.88,
          "October 2026": 5121595.05,
          "November 2026": 1361738.66
        },
        "totalCollection": 46545244.65,
        "remainingBalance": 18218708.4,
        "effPerTargetPct": 71.87,
        "ytdCumEffPct": 83.25
      },
      {
        "arTag": "September 2026",
        "billedTarget": 47006745.08,
        "monthlyCollections": {
          "January 2026": 0,
          "February 2026": 0,
          "March 2026": 0,
          "April 2026": 0,
          "May 2026": 0,
          "June 2026": 0,
          "July 2026": 0,
          "August 2026": 0,
          "September 2026": 14832085.55,
          "October 2026": 10894101.98,
          "November 2026": 1553227.05
        },
        "totalCollection": 27279414.58,
        "remainingBalance": 19727330.5,
        "effPerTargetPct": 58.03,
        "ytdCumEffPct": 80.63
      },
      {
        "arTag": "October 2026",
        "billedTarget": 59136376.39,
        "monthlyCollections": {
          "January 2026": 121000,
          "February 2026": 0,
          "March 2026": 0,
          "April 2026": 0,
          "May 2026": 0,
          "June 2026": 0,
          "July 2026": 0,
          "August 2026": 0,
          "September 2026": 0,
          "October 2026": 14985825.49,
          "November 2026": 11221656.03
        },
        "totalCollection": 26328481.52,
        "remainingBalance": 32807894.87,
        "effPerTargetPct": 44.52,
        "ytdCumEffPct": 76.45
      },
      {
        "arTag": "November 2026",
        "billedTarget": 9045956.79,
        "monthlyCollections": {
          "January 2026": 0,
          "February 2026": 0,
          "March 2026": 0,
          "April 2026": 0,
          "May 2026": 0,
          "June 2026": 0,
          "July 2026": 0,
          "August 2026": 0,
          "September 2026": 0,
          "October 2026": 0,
          "November 2026": 9045956.81
        },
        "totalCollection": 9045956.81,
        "remainingBalance": -0.02,
        "effPerTargetPct": 100,
        "ytdCumEffPct": 76.86
      }
    ],
    "columnTotals": {
      "January 2026": 38230603.01,
      "February 2026": 26400747.26,
      "March 2026": 27238440.5,
      "April 2026": 40525266.06,
      "May 2026": 34027683.78,
      "June 2026": 26555441.79,
      "July 2026": 42734070.93,
      "August 2026": 30705502.31,
      "September 2026": 63744771.85,
      "October 2026": 41324736.51,
      "November 2026": 28407469.05
    },
    "grandTotalBilled": 520297537.71,
    "grandTotalCollected": 399894733.05,
    "grandTotalRemaining": 120402804.66,
    "grandTotalEffPct": 76.86
  },
  "serviceBalances": [
    {
      "serviceType": "PMA - STAFF COST",
      "billed": 253592464.51,
      "collections": 194291908.73,
      "remainingBalance": 59300555.78
    },
    {
      "serviceType": "PMA - MNGMT FEE",
      "billed": 77053412.13,
      "collections": 58900463.11,
      "remainingBalance": 18152949.02
    },
    {
      "serviceType": "AC CLEANING",
      "billed": 93275622.52,
      "collections": 76142596.43,
      "remainingBalance": 17133026.09
    },
    {
      "serviceType": "AD HOC/AC REPAIRS",
      "billed": 72759971.88,
      "collections": 61727881.65,
      "remainingBalance": 11032090.23
    },
    {
      "serviceType": "PMA- ADVANCES",
      "billed": 12201304.95,
      "collections": 1351784.26,
      "remainingBalance": 10849520.69
    },
    {
      "serviceType": "FACILITIES MGMT",
      "billed": 3085537.08,
      "collections": 1194982.96,
      "remainingBalance": 1890554.12
    },
    {
      "serviceType": "OCS-STAFF COST",
      "billed": 1364832,
      "collections": 0,
      "remainingBalance": 1364832
    },
    {
      "serviceType": "VETTING FEE",
      "billed": 3851184.64,
      "collections": 3171907.91,
      "remainingBalance": 679276.73
    },
    {
      "serviceType": "Project Management",
      "billed": 3113208,
      "collections": 3113208,
      "remainingBalance": 0
    }
  ],
  "clientAgingRows": [
    {
      "client": "ONE UPTOWN RESIDENCE CONDOMINIUM ASSOC. INC.",
      "aging91Above": 8578233.94,
      "agingCurrent": 0,
      "aging1To30": 862679.51,
      "aging31To60": 901346.93,
      "aging61To90": 727356.88,
      "grandTotal": 11069617.26
    },
    {
      "client": "MREIT, INC.",
      "aging91Above": 3482425.76,
      "agingCurrent": 0,
      "aging1To30": 2983845.26,
      "aging31To60": 2937209.59,
      "aging61To90": 1587425.6,
      "grandTotal": 10990906.21
    },
    {
      "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
      "aging91Above": 4991543.86,
      "agingCurrent": 0,
      "aging1To30": 873889.21,
      "aging31To60": 483392.01,
      "aging61To90": 483392.01,
      "grandTotal": 6832217.09
    },
    {
      "client": "MREIT PROPERTY MANAGERS, INC.",
      "aging91Above": 0.02,
      "agingCurrent": 0,
      "aging1To30": 2234622,
      "aging31To60": 2234622,
      "aging61To90": 2234622.05,
      "grandTotal": 6703866.07
    },
    {
      "client": "UPTOWN PARKSUITES CONDOMINIUM ASSOCIATION, INC.",
      "aging91Above": 2469768.93,
      "agingCurrent": 0,
      "aging1To30": 1313382.49,
      "aging31To60": 1168554.47,
      "aging61To90": 971416.6,
      "grandTotal": 5923122.49
    },
    {
      "client": "CHELSEA PARKPLACE CONDOMINIUM ASSOCIATION INC.",
      "aging91Above": 4856483.51,
      "agingCurrent": 0,
      "aging1To30": 344732.79,
      "aging31To60": 283663.73,
      "aging61To90": 283663.73,
      "grandTotal": 5768543.76
    },
    {
      "client": "TOWNSQUARE DEVELOPMENT INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 5645002,
      "grandTotal": 5645002
    },
    {
      "client": "THE VERDIN AT MAPLE GROVE CONDOMINIUM ASSOCIATION INC.",
      "aging91Above": 4163173.96,
      "agingCurrent": 0,
      "aging1To30": 116405.97,
      "aging31To60": 116405.97,
      "aging61To90": 116405.97,
      "grandTotal": 4512391.87
    },
    {
      "client": "UPTOWN EASTGATE BUILDING ADMINISTRATION INC.",
      "aging91Above": -0.03,
      "agingCurrent": 0,
      "aging1To30": 946488.94,
      "aging31To60": 2616422.14,
      "aging61To90": 743043.93,
      "grandTotal": 4305954.98
    },
    {
      "client": "UPTOWN ARTS RESIDENCE CONDOMINIUM ASSOCIATION INC",
      "aging91Above": 2129122.19,
      "agingCurrent": 0,
      "aging1To30": 842461.6,
      "aging31To60": 519895.5,
      "aging61To90": 519895.5,
      "grandTotal": 4011374.79
    },
    {
      "client": "THE PINNACLE ILOILO CONDOMINIUM ASSOCIATION, INC.",
      "aging91Above": 1752517.75,
      "agingCurrent": 0,
      "aging1To30": 930010.27,
      "aging31To60": 498187.82,
      "aging61To90": 464587.81,
      "grandTotal": 3645303.65
    },
    {
      "client": "THE ELLIS CONDOMINIUM ASSOCIATION INC.",
      "aging91Above": 984503.79,
      "agingCurrent": 0,
      "aging1To30": 1637909.38,
      "aging31To60": 422255.47,
      "aging61To90": 463470.78,
      "grandTotal": 3508139.42
    },
    {
      "client": "BRYANT PARKLANE CONDOMINIUM ASSOCIATION INC.",
      "aging91Above": 1741261.97,
      "agingCurrent": 0,
      "aging1To30": 794603.3,
      "aging31To60": 378630.93,
      "aging61To90": 378630.93,
      "grandTotal": 3293127.13
    },
    {
      "client": "NO. 1 UPPER EAST AVENUE BUILDING ADMINISTRATION INC.",
      "aging91Above": 1472635.96,
      "agingCurrent": 0,
      "aging1To30": 940925.72,
      "aging31To60": 529835.05,
      "aging61To90": 306133.28,
      "grandTotal": 3249530.01
    },
    {
      "client": "ENTERPRISE TWO BUILDING ADMINISTRATION, INC.",
      "aging91Above": 1273225.62,
      "agingCurrent": 0,
      "aging1To30": 788337.09,
      "aging31To60": 562387.91,
      "aging61To90": 285033.32,
      "grandTotal": 2908983.94
    },
    {
      "client": "THE VION TOWER",
      "aging91Above": 541671.84,
      "agingCurrent": 0,
      "aging1To30": 1012993.95,
      "aging31To60": 541671.83,
      "aging61To90": 541671.83,
      "grandTotal": 2638009.45
    },
    {
      "client": "BAYSHORE RESIDENTIAL RESORT 2 ASSOCIATION INC.",
      "aging91Above": 1367618.97,
      "agingCurrent": 0,
      "aging1To30": 1187539.51,
      "aging31To60": 40880,
      "aging61To90": 0,
      "grandTotal": 2596038.48
    },
    {
      "client": "THE PALLADIUM CONDOMINIUM ASSOCIATION INC.",
      "aging91Above": -0.01,
      "agingCurrent": 0,
      "aging1To30": 2422312.3,
      "aging31To60": -0.01,
      "aging61To90": 56627.99,
      "grandTotal": 2478940.27
    },
    {
      "client": "ONE CORPORATE PLACE BUILDING ADMINISTRATION INC",
      "aging91Above": 1821380.64,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 295699.11,
      "aging61To90": 306451.11,
      "grandTotal": 2423530.86
    },
    {
      "client": "FORBES HILL HOMEOWNERS ASSOCIATION INC.",
      "aging91Above": 542723.06,
      "agingCurrent": 0,
      "aging1To30": 1875117.14,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 2417840.2
    },
    {
      "client": "MREIT FUND MANAGERS, INC.",
      "aging91Above": 125999.98,
      "agingCurrent": 0,
      "aging1To30": 731145.11,
      "aging31To60": 731145.11,
      "aging61To90": 731145.17,
      "grandTotal": 2319435.37
    },
    {
      "client": "ARCOVIA PALAZZO CONDOMINIUM ASSOCIATION, INC.",
      "aging91Above": 739963.28,
      "agingCurrent": 0,
      "aging1To30": 1137807.81,
      "aging31To60": 0,
      "aging61To90": -0.02,
      "grandTotal": 1877771.07
    },
    {
      "client": "LA CASSIA RESIDENCES CONDOMINIUM ASSOCIATION, INC.",
      "aging91Above": 763799.33,
      "agingCurrent": 0,
      "aging1To30": 322278.4,
      "aging31To60": 291549.98,
      "aging61To90": 291549.98,
      "grandTotal": 1669177.69
    },
    {
      "client": "18 AVENUE DE TRIOMPHE CONDOMINIUM ASSOCIATION, INC.",
      "aging91Above": 0.02,
      "agingCurrent": 0,
      "aging1To30": 843500.03,
      "aging31To60": 490712.19,
      "aging61To90": 0,
      "grandTotal": 1334212.24
    },
    {
      "client": "ST. HONORE & ST. DOMINIQUE CONDOMINIUM ASSOCIATION INC",
      "aging91Above": 0.01,
      "agingCurrent": 0,
      "aging1To30": 1289482.23,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 1289482.24
    },
    {
      "client": "TWO REGIS CONDOMINIUM ASSOCIATION INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 731128.79,
      "aging31To60": 530338.16,
      "aging61To90": 0.01,
      "grandTotal": 1261466.96
    },
    {
      "client": "MEGAWORLD CORPORATION FAO:MACTAN NEWTOWN SALES AND INFORMATION CENTER",
      "aging91Above": 1081795.2,
      "agingCurrent": 0,
      "aging1To30": 117739.94,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 1199535.14
    },
    {
      "client": "INTERNATIONAL FINANCE CENTER BUILDING ADMINISTRATION INC.",
      "aging91Above": 706097.81,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 35280,
      "aging61To90": 434701.39,
      "grandTotal": 1176079.2
    },
    {
      "client": "MEGAWORLD CORPORATION FAO: THE WOODRIDGE RESIDENCES",
      "aging91Above": 1014654.23,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 1014654.23
    },
    {
      "client": "MEGAWORLD RESORT ESTATES, INC. FAO: ARCOVIA CITY SHOWROOM & EASTWOOD CITY SHOWROOM",
      "aging91Above": 259000.02,
      "agingCurrent": 0,
      "aging1To30": 227327.53,
      "aging31To60": 521350.48,
      "aging61To90": 0.01,
      "grandTotal": 1007678.04
    },
    {
      "client": "UPTOWN PLACE BUILDING ADMINISTRATION, INC.",
      "aging91Above": 552774.68,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 374864,
      "aging61To90": 0,
      "grandTotal": 927638.68
    },
    {
      "client": "ST MORITZ PRIVATE ESTATE CONDOMINIUM ASSOCIATION INC",
      "aging91Above": -0.01,
      "agingCurrent": 0,
      "aging1To30": 444469.07,
      "aging31To60": 444469.07,
      "aging61To90": 0,
      "grandTotal": 888938.13
    },
    {
      "client": "MCKINLEY WEST CAMPUS BUILDING ADMINISTRATION, INC.",
      "aging91Above": 819346.16,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": -0.01,
      "aging61To90": 0,
      "grandTotal": 819346.15
    },
    {
      "client": "GENTRY MANOR CONDOMINIUM ASSOCIATION INC",
      "aging91Above": -3210,
      "agingCurrent": 0,
      "aging1To30": 400889.93,
      "aging31To60": 0,
      "aging61To90": 363127.33,
      "grandTotal": 760807.26
    },
    {
      "client": "MREIT, INC. MWC",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 739324,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 739324
    },
    {
      "client": "MREIT INC. FAO MWC",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 497817.6,
      "aging61To90": 185304,
      "grandTotal": 683121.6
    },
    {
      "client": "ONE PASEO BUILDING ADMINISTRATION INC",
      "aging91Above": 82615.9,
      "agingCurrent": 0,
      "aging1To30": 55016.17,
      "aging31To60": 435250.37,
      "aging61To90": 0,
      "grandTotal": 572882.44
    },
    {
      "client": "JPMORGAN CHASE BANK PHILIPPINE GLOBAL SERVICE CENTER",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 506000,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 506000
    },
    {
      "client": "THE ALBANY LUXURY RESIDENCE CONDOMINIUM ASSOCIATION INC",
      "aging91Above": 0.01,
      "agingCurrent": 0,
      "aging1To30": 481661.96,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 481661.97
    },
    {
      "client": "ONE MADISON PLACE CONDOMINIUM ASSOCIATION, INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 476523.14,
      "aging31To60": -3046.88,
      "aging61To90": 0,
      "grandTotal": 473476.26
    },
    {
      "client": "PARK MCKINLEY WEST CONDOMINIUM ASSOCIATION INC",
      "aging91Above": -0.01,
      "agingCurrent": 0,
      "aging1To30": 415235.9,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 415235.89
    },
    {
      "client": "TUSCANY PRIVATE ESTATE CONDOMINIUM ASSOCIATION, INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 389480.61,
      "aging31To60": 0,
      "aging61To90": -0.01,
      "grandTotal": 389480.6
    },
    {
      "client": "ONE CORPORATE PLACE CONDOMINIUM CORPORATION",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 295699.11,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 295699.11
    },
    {
      "client": "MAKATI SAN ANTONIO RESIDENCE CONDOMINIUM ASSOCIATION INC",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 291915.02,
      "aging61To90": 0.05,
      "grandTotal": 291915.07
    },
    {
      "client": "MEGAWORLD CORPORATION FAO: UPPER EAST HOUSE SHOWROOM",
      "aging91Above": 166192.49,
      "agingCurrent": 0,
      "aging1To30": 122543.03,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 288735.52
    },
    {
      "client": "MEGAWORLD CORPORATION:UEG/IBP",
      "aging91Above": 154604.83,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 71377.6,
      "aging61To90": 0,
      "grandTotal": 225982.43
    },
    {
      "client": "PEERWEALTH CORP.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 218785,
      "aging61To90": 0,
      "grandTotal": 218785
    },
    {
      "client": "TRENDS AND CONCEPTS TOTAL INTERIOR SOLUTIONS, INC.",
      "aging91Above": 211390.21,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 3160,
      "aging61To90": 0,
      "grandTotal": 214550.21
    },
    {
      "client": "PASUDECO TOWER BUILDING ADMINISTRATION, INC.",
      "aging91Above": 13485.11,
      "agingCurrent": 0,
      "aging1To30": 155043.47,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 168528.58
    },
    {
      "client": "MAPLE GROVE COMMERCIAL DISTRICT ESTATE",
      "aging91Above": -0.01,
      "agingCurrent": 0,
      "aging1To30": -0.01,
      "aging31To60": 166879.51,
      "aging61To90": 0,
      "grandTotal": 166879.49
    },
    {
      "client": "MEGAWORLD CORPORATION FAO:IBP SALES AND INFORMATION SHOWROOM",
      "aging91Above": 166270.66,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 166270.66
    },
    {
      "client": "ENTERPRISE ONE BUILDING ADMINISTRATION, INC.",
      "aging91Above": -0.06,
      "agingCurrent": 0,
      "aging1To30": 152248.58,
      "aging31To60": -0.01,
      "aging61To90": -0.01,
      "grandTotal": 152248.5
    },
    {
      "client": "JPMORGAN CHASE PHILIPPINE SERVICES INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 150080,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 150080
    },
    {
      "client": "7 MANREBO CONSTRUCTION",
      "aging91Above": 144360.2,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 144360.2
    },
    {
      "client": "KNACK GLOBAL PHILIPPINES, INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 140000,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 140000
    },
    {
      "client": "MEGWORLD CORPORATION FAO: ILOILO BUSINESS PARK SALES AND INFORMATION CENTER",
      "aging91Above": 130360,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 130360
    },
    {
      "client": "CXLOYALTY TRAVEL SERVICES PHILIPPINES",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 120000,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 120000
    },
    {
      "client": "LAFAYETTE PARK SQUARE CONDOMINIUM ASSOCIATION INC",
      "aging91Above": -0.09,
      "agingCurrent": 0,
      "aging1To30": 85068.44,
      "aging31To60": 33402.87,
      "aging61To90": -0.01,
      "grandTotal": 118471.21
    },
    {
      "client": "TWO FINTECH PLACE BUILDING ADMINISTRATION INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 95137.2,
      "grandTotal": 95137.2
    },
    {
      "client": "MEGAWORLD CORPORATION FAO: MCKINLEY HILL INFORMATION CENTER",
      "aging91Above": 89733.27,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 89733.27
    },
    {
      "client": "WORLDWIDE PLAZA BUILDING ADMINISTRATION INC",
      "aging91Above": 0.19,
      "agingCurrent": 0,
      "aging1To30": 86339.29,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 86339.48
    },
    {
      "client": "TARAVEZA CONSTRUCTION CORPORATION",
      "aging91Above": 84000,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 84000
    },
    {
      "client": "MICROSOURCING PHILIPPINES, INC.",
      "aging91Above": 75000,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 75000
    },
    {
      "client": "ONE FINTECH BUILDING ADMINISTRATION INC",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 71013.25,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 71013.25
    },
    {
      "client": "BUILDSWORTH CONSTRUCTION",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 37500,
      "aging61To90": 0,
      "grandTotal": 37500
    },
    {
      "client": "CONVERGE INFORMATION AND COMMUNICATIONS TECHNOLOGY",
      "aging91Above": 29772.73,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 29772.73
    },
    {
      "client": "DACARA, ANGEL MARK AUSTRIA",
      "aging91Above": 18368,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 18368
    },
    {
      "client": "SPECTROPLUS CONSTRUCTION SERVICES",
      "aging91Above": 17920,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 17920
    },
    {
      "client": "LIGHT AND WONDER SERVICE PHILIPPINES INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 15904,
      "aging61To90": 0,
      "grandTotal": 15904
    },
    {
      "client": "MC BUILDERS AND SUPPLIES INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 7616,
      "aging61To90": 0,
      "grandTotal": 7616
    },
    {
      "client": "ELVORA CORP.",
      "aging91Above": 7616,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 7616
    },
    {
      "client": "GOODEATS FOOD SUPPLY TRADING",
      "aging91Above": 7504,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 7504
    },
    {
      "client": "IO GROUP INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 7504,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 7504
    },
    {
      "client": "GECO PHILIPPINES INC",
      "aging91Above": 7280,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 7280
    },
    {
      "client": "CITYFRONT BUILDING ADMINISTRATION INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 5088.69,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 5088.69
    },
    {
      "client": "JK Food and Restaurant, OPC",
      "aging91Above": 4928,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 4928
    },
    {
      "client": "FALLORIN, REGINA CUENCA",
      "aging91Above": 3864,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 3864
    },
    {
      "client": "ONG, MANUELETTE GO",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 2912,
      "grandTotal": 2912
    },
    {
      "client": "Jinky Jalandoni Cope",
      "aging91Above": 2912,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 2912
    },
    {
      "client": "THE LEAD TREE INT CORP",
      "aging91Above": 2518.15,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": 2518.15
    },
    {
      "client": "JAVIER PROJECT MANAGERS INC",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0.01,
      "grandTotal": 0.01
    },
    {
      "client": "CTRL CONSTRUCTION, CORP",
      "aging91Above": -0.01,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": -0.01
    },
    {
      "client": "MEGAWORLD CORPORATION : Maple Grove Park Village",
      "aging91Above": -0.01,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": -0.01
    },
    {
      "client": "PALVER BUILDERS AND LANDSCAPING",
      "aging91Above": -0.01,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": -0.01
    },
    {
      "client": "SALEMAIRE INDUSTRIES CORP.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": -0.01,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": -0.01
    },
    {
      "client": "GENESIS PLUMBING AND FIRE PROTECTION INC.",
      "aging91Above": 0,
      "agingCurrent": -0.01,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": -0.01
    },
    {
      "client": "DAV DEVELOPMENT AND CONTRUCTION CORPORATION",
      "aging91Above": 0,
      "agingCurrent": -0.01,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": -0.01
    },
    {
      "client": "SUNNY COAST RESIDENTIAL RESORT CONDOMINIUM ASSOCIATION INC.",
      "aging91Above": 0,
      "agingCurrent": 0,
      "aging1To30": -0.01,
      "aging31To60": 0,
      "aging61To90": -0.01,
      "grandTotal": -0.02
    },
    {
      "client": "ONE REGIS CONDOMINIUM ASSOCIATION INC.",
      "aging91Above": -0.02,
      "agingCurrent": 0,
      "aging1To30": -0.01,
      "aging31To60": -0.01,
      "aging61To90": -0.01,
      "grandTotal": -0.05
    },
    {
      "client": "FC DINO CONSTRUCTION",
      "aging91Above": -337.06,
      "agingCurrent": 0,
      "aging1To30": 0,
      "aging31To60": 0,
      "aging61To90": 0,
      "grandTotal": -337.06
    }
  ],
  "arLineItems": [
      {
          "client": "ONE UPTOWN RESIDENCE CONDOMINIUM ASSOC. INC.",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 8297561.94
      },
      {
          "client": "TOWNSQUARE DEVELOPMENT INC.",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "61-90 days",
          "remainingBalance": 5645002
      },
      {
          "client": "CHELSEA PARKPLACE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 3210738.35
      },
      {
          "client": "MREIT, INC.",
          "areaManager": "RALPH",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": 3161752.15
      },
      {
          "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 3049943.86
      },
      {
          "client": "THE VERDIN AT MAPLE GROVE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 2824415.56
      },
      {
          "client": "UPTOWN EASTGATE BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "AC CLEANING",
          "agingBucket": "31-60 days",
          "remainingBalance": 2476422.14
      },
      {
          "client": "MREIT PROPERTY MANAGERS, INC.",
          "areaManager": "RALPH",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 2234622.05
      },
      {
          "client": "MREIT PROPERTY MANAGERS, INC.",
          "areaManager": "RALPH",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 2234622
      },
      {
          "client": "MREIT PROPERTY MANAGERS, INC.",
          "areaManager": "RALPH",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 2234622
      },
      {
          "client": "MREIT, INC.",
          "areaManager": "RALPH",
          "serviceType": "AC CLEANING",
          "agingBucket": "31-60 days",
          "remainingBalance": 2053899.2
      },
      {
          "client": "UPTOWN PARKSUITES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 1966328.92
      },
      {
          "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 1941600.01
      },
      {
          "client": "MREIT, INC.",
          "areaManager": "RALPH",
          "serviceType": "AC CLEANING",
          "agingBucket": "1-30 days",
          "remainingBalance": 1916620
      },
      {
          "client": "THE PALLADIUM CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 1882343.1
      },
      {
          "client": "CHELSEA PARKPLACE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 1645745.16
      },
      {
          "client": "FORBES HILL HOMEOWNERS ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 1586855.33
      },
      {
          "client": "UPTOWN ARTS RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 1511222.93
      },
      {
          "client": "BAYSHORE RESIDENTIAL RESORT 2 ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "OCS-STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 1364832
      },
      {
          "client": "THE VERDIN AT MAPLE GROVE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 1293600
      },
      {
          "client": "BRYANT PARKLANE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 1237261.97
      },
      {
          "client": "THE ELLIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 1215653.91
      },
      {
          "client": "ONE CORPORATE PLACE BUILDING ADMINISTRATION INC",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 1082180.64
      },
      {
          "client": "MEGAWORLD CORPORATION FAO:MACTAN NEWTOWN SALES AND INFORMATION CENTER",
          "areaManager": "LYKA",
          "serviceType": "FACILITIES MGMT",
          "agingBucket": "91 days above",
          "remainingBalance": 1081795.2
      },
      {
          "client": "THE PINNACLE ILOILO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 1080517.75
      },
      {
          "client": "MREIT, INC.",
          "areaManager": "RALPH",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "61-90 days",
          "remainingBalance": 1076287.19
      },
      {
          "client": "MREIT, INC.",
          "areaManager": "RALPH",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "1-30 days",
          "remainingBalance": 1067225.26
      },
      {
          "client": "UPTOWN PARKSUITES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 1055886.78
      },
      {
          "client": "MEGAWORLD CORPORATION FAO: THE WOODRIDGE RESIDENCES",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 1014654.23
      },
      {
          "client": "ST. HONORE & ST. DOMINIQUE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "JANINE",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 1003882.23
      },
      {
          "client": "UPTOWN PARKSUITES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 921594.47
      },
      {
          "client": "ONE UPTOWN RESIDENCE CONDOMINIUM ASSOC. INC.",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 901346.93
      },
      {
          "client": "MREIT, INC.",
          "areaManager": "RALPH",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "31-60 days",
          "remainingBalance": 883310.39
      },
      {
          "client": "NO. 1 UPPER EAST AVENUE BUILDING ADMINISTRATION INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 873600
      },
      {
          "client": "ONE UPTOWN RESIDENCE CONDOMINIUM ASSOC. INC.",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 862679.51
      },
      {
          "client": "BAYSHORE RESIDENTIAL RESORT 2 ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 807403.8
      },
      {
          "client": "ONE CORPORATE PLACE BUILDING ADMINISTRATION INC",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 739200
      },
      {
          "client": "INTERNATIONAL FINANCE CENTER BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 737597.82
      },
      {
          "client": "MREIT FUND MANAGERS, INC.",
          "areaManager": "RALPH",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 731145.17
      },
      {
          "client": "MREIT FUND MANAGERS, INC.",
          "areaManager": "RALPH",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 731145.11
      },
      {
          "client": "MREIT FUND MANAGERS, INC.",
          "areaManager": "RALPH",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 731145.11
      },
      {
          "client": "ONE UPTOWN RESIDENCE CONDOMINIUM ASSOC. INC.",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 727356.88
      },
      {
          "client": "UPTOWN PARKSUITES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 724456.6
      },
      {
          "client": "ARCOVIA PALAZZO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 701007.81
      },
      {
          "client": "THE ELLIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 693443.79
      },
      {
          "client": "MCKINLEY WEST CAMPUS BUILDING ADMINISTRATION, INC.",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": 685440
      },
      {
          "client": "MREIT, INC. MWC",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "1-30 days",
          "remainingBalance": 685440
      },
      {
          "client": "THE PINNACLE ILOILO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 672000
      },
      {
          "client": "ENTERPRISE TWO BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 672000
      },
      {
          "client": "UPTOWN EASTGATE BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "AC CLEANING",
          "agingBucket": "61-90 days",
          "remainingBalance": 603043.93
      },
      {
          "client": "ENTERPRISE TWO BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 601225.62
      },
      {
          "client": "NO. 1 UPPER EAST AVENUE BUILDING ADMINISTRATION INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 599035.96
      },
      {
          "client": "UPTOWN ARTS RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 574451.62
      },
      {
          "client": "NO. 1 UPPER EAST AVENUE BUILDING ADMINISTRATION INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 568114.99
      },
      {
          "client": "UPTOWN PLACE BUILDING ADMINISTRATION, INC.",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": 552774.67
      },
      {
          "client": "THE PALLADIUM CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 539969.2
      },
      {
          "client": "LA CASSIA RESIDENCES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 539799.33
      },
      {
          "client": "UPTOWN EASTGATE BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 536316.8
      },
      {
          "client": "18 AVENUE DE TRIOMPHE CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 518943.04
      },
      {
          "client": "FORBES HILL HOMEOWNERS ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 515485.38
      },
      {
          "client": "MREIT, INC.",
          "areaManager": "RALPH",
          "serviceType": "AC CLEANING",
          "agingBucket": "61-90 days",
          "remainingBalance": 511138.41
      },
      {
          "client": "JPMORGAN CHASE BANK PHILIPPINE GLOBAL SERVICE CENTER",
          "areaManager": "CEZAR",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "1-30 days",
          "remainingBalance": 506000
      },
      {
          "client": "BRYANT PARKLANE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 504000
      },
      {
          "client": "UPTOWN PARKSUITES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 493920
      },
      {
          "client": "18 AVENUE DE TRIOMPHE CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 490712.19
      },
      {
          "client": "BRYANT PARKLANE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 490039.76
      },
      {
          "client": "ARCOVIA PALAZZO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 481600
      },
      {
          "client": "THE VION TOWER",
          "areaManager": "HARVEY",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 471322.12
      },
      {
          "client": "THE PINNACLE ILOILO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 465422.45
      },
      {
          "client": "ENTERPRISE TWO BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 450387.91
      },
      {
          "client": "ARCOVIA PALAZZO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 436800
      },
      {
          "client": "ONE PASEO BUILDING ADMINISTRATION INC",
          "areaManager": "CEZAR",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "31-60 days",
          "remainingBalance": 435250.37
      },
      {
          "client": "INTERNATIONAL FINANCE CENTER BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "AC CLEANING",
          "agingBucket": "61-90 days",
          "remainingBalance": 434701.39
      },
      {
          "client": "TWO REGIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 418338.16
      },
      {
          "client": "TWO REGIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 418338.16
      },
      {
          "client": "PARK MCKINLEY WEST CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 415235.9
      },
      {
          "client": "THE ALBANY LUXURY RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 408621.96
      },
      {
          "client": "MEGAWORLD RESORT ESTATES, INC. FAO: ARCOVIA CITY SHOWROOM & EASTWOOD CITY SHOWROOM",
          "areaManager": "ANGIE",
          "serviceType": "AC CLEANING",
          "agingBucket": "31-60 days",
          "remainingBalance": 407889.89
      },
      {
          "client": "GENTRY MANOR CONDOMINIUM ASSOCIATION INC",
          "areaManager": "ROWENA",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 397679.93
      },
      {
          "client": "TUSCANY PRIVATE ESTATE CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 389480.61
      },
      {
          "client": "UPTOWN PLACE BUILDING ADMINISTRATION, INC.",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "31-60 days",
          "remainingBalance": 374864
      },
      {
          "client": "ENTERPRISE TWO BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 374122.13
      },
      {
          "client": "UPTOWN ARTS RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 372055.5
      },
      {
          "client": "UPTOWN ARTS RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 372055.5
      },
      {
          "client": "UPTOWN ARTS RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 372055.5
      },
      {
          "client": "UPTOWN EASTGATE BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 370440
      },
      {
          "client": "BAYSHORE RESIDENTIAL RESORT 2 ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 369600
      },
      {
          "client": "THE ELLIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 366450.78
      },
      {
          "client": "GENTRY MANOR CONDOMINIUM ASSOCIATION INC",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 363127.33
      },
      {
          "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
          "areaManager": "LYKA",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 347217.2
      },
      {
          "client": "ST MORITZ PRIVATE ESTATE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 345685.07
      },
      {
          "client": "ST MORITZ PRIVATE ESTATE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 345685.07
      },
      {
          "client": "NO. 1 UPPER EAST AVENUE BUILDING ADMINISTRATION INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 345035.05
      },
      {
          "client": "THE VION TOWER",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 340071.84
      },
      {
          "client": "THE VION TOWER",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 340071.83
      },
      {
          "client": "THE VION TOWER",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 340071.83
      },
      {
          "client": "THE VION TOWER",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 340071.83
      },
      {
          "client": "ONE MADISON PLACE CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 336523.14
      },
      {
          "client": "THE PINNACLE ILOILO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 330187.82
      },
      {
          "client": "THE PINNACLE ILOILO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 330187.82
      },
      {
          "client": "THE PINNACLE ILOILO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 330187.81
      },
      {
          "client": "THE ELLIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 325235.47
      },
      {
          "client": "THE ELLIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 325235.47
      },
      {
          "client": "18 AVENUE DE TRIOMPHE CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 324556.99
      },
      {
          "client": "UPTOWN ARTS RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 322566.1
      },
      {
          "client": "MREIT, INC.",
          "areaManager": "RALPH",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 320673.61
      },
      {
          "client": "ENTERPRISE TWO BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 302214.96
      },
      {
          "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 298592.01
      },
      {
          "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 298592.01
      },
      {
          "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 298592.01
      },
      {
          "client": "MAKATI SAN ANTONIO RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 291915.02
      },
      {
          "client": "THE ELLIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 291060
      },
      {
          "client": "FORBES HILL HOMEOWNERS ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 288261.81
      },
      {
          "client": "ONE UPTOWN RESIDENCE CONDOMINIUM ASSOC. INC.",
          "areaManager": "HARVEY",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 280672
      },
      {
          "client": "MREIT INC. FAO MWC",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "31-60 days",
          "remainingBalance": 262080
      },
      {
          "client": "MEGAWORLD RESORT ESTATES, INC. FAO: ARCOVIA CITY SHOWROOM & EASTWOOD CITY SHOWROOM",
          "areaManager": "ANGIE",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 259000
      },
      {
          "client": "ARCOVIA PALAZZO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 258363.28
      },
      {
          "client": "UPTOWN PARKSUITES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 246960
      },
      {
          "client": "UPTOWN PARKSUITES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 246960
      },
      {
          "client": "UPTOWN PARKSUITES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 246960
      },
      {
          "client": "MREIT INC. FAO MWC",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "31-60 days",
          "remainingBalance": 235737.6
      },
      {
          "client": "MEGAWORLD RESORT ESTATES, INC. FAO: ARCOVIA CITY SHOWROOM & EASTWOOD CITY SHOWROOM",
          "areaManager": "ANGIE",
          "serviceType": "FACILITIES MGMT",
          "agingBucket": "1-30 days",
          "remainingBalance": 227327.53
      },
      {
          "client": "LA CASSIA RESIDENCES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 224000
      },
      {
          "client": "PEERWEALTH CORP.",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "31-60 days",
          "remainingBalance": 218785
      },
      {
          "client": "TRENDS AND CONCEPTS TOTAL INTERIOR SOLUTIONS, INC.",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": 211390.21
      },
      {
          "client": "BRYANT PARKLANE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 210630.93
      },
      {
          "client": "BRYANT PARKLANE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 210630.93
      },
      {
          "client": "ONE CORPORATE PLACE BUILDING ADMINISTRATION INC",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 203299.11
      },
      {
          "client": "ONE CORPORATE PLACE BUILDING ADMINISTRATION INC",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 203299.11
      },
      {
          "client": "ONE CORPORATE PLACE CONDOMINIUM CORPORATION",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 203299.11
      },
      {
          "client": "THE VION TOWER",
          "areaManager": "HARVEY",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 201600
      },
      {
          "client": "THE VION TOWER",
          "areaManager": "HARVEY",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 201600
      },
      {
          "client": "THE VION TOWER",
          "areaManager": "HARVEY",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 201600
      },
      {
          "client": "THE VION TOWER",
          "areaManager": "HARVEY",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 201600
      },
      {
          "client": "TWO REGIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 200790.63
      },
      {
          "client": "CHELSEA PARKPLACE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 186032.55
      },
      {
          "client": "CHELSEA PARKPLACE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 186032.55
      },
      {
          "client": "CHELSEA PARKPLACE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 186032.55
      },
      {
          "client": "MREIT INC. FAO MWC",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "61-90 days",
          "remainingBalance": 185304
      },
      {
          "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 184800
      },
      {
          "client": "NO. 1 UPPER EAST AVENUE BUILDING ADMINISTRATION INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 184800
      },
      {
          "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 184800
      },
      {
          "client": "NO. 1 UPPER EAST AVENUE BUILDING ADMINISTRATION INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 184800
      },
      {
          "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 184800
      },
      {
          "client": "NO. 1 UPPER EAST AVENUE BUILDING ADMINISTRATION INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 184800
      },
      {
          "client": "LA CASSIA RESIDENCES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 179549.98
      },
      {
          "client": "LA CASSIA RESIDENCES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 179549.98
      },
      {
          "client": "NO. 1 UPPER EAST AVENUE BUILDING ADMINISTRATION INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 177258.73
      },
      {
          "client": "ENTERPRISE TWO BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 173033.32
      },
      {
          "client": "THE PINNACLE ILOILO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 168000
      },
      {
          "client": "BRYANT PARKLANE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 168000
      },
      {
          "client": "BRYANT PARKLANE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 168000
      },
      {
          "client": "BRYANT PARKLANE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 168000
      },
      {
          "client": "LA CASSIA RESIDENCES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 168000
      },
      {
          "client": "MAPLE GROVE COMMERCIAL DISTRICT ESTATE",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 166879.51
      },
      {
          "client": "MEGAWORLD CORPORATION FAO:IBP SALES AND INFORMATION SHOWROOM",
          "areaManager": "LYKA",
          "serviceType": "FACILITIES MGMT",
          "agingBucket": "91 days above",
          "remainingBalance": 166270.66
      },
      {
          "client": "MEGAWORLD CORPORATION FAO: UPPER EAST HOUSE SHOWROOM",
          "areaManager": "LYKA",
          "serviceType": "FACILITIES MGMT",
          "agingBucket": "91 days above",
          "remainingBalance": 166192.49
      },
      {
          "client": "PASUDECO TOWER BUILDING ADMINISTRATION, INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 155043.47
      },
      {
          "client": "MEGAWORLD CORPORATION:UEG/IBP",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 154604.82
      },
      {
          "client": "ENTERPRISE ONE BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 152248.59
      },
      {
          "client": "JPMORGAN CHASE PHILIPPINE SERVICES INC.",
          "areaManager": "CEZAR",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "1-30 days",
          "remainingBalance": 150080
      },
      {
          "client": "ST. HONORE & ST. DOMINIQUE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "JANINE",
          "serviceType": "AC CLEANING",
          "agingBucket": "1-30 days",
          "remainingBalance": 148960
      },
      {
          "client": "UPTOWN ARTS RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 147840
      },
      {
          "client": "UPTOWN ARTS RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 147840
      },
      {
          "client": "UPTOWN ARTS RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 147840
      },
      {
          "client": "7 MANREBO CONSTRUCTION",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": 144360.2
      },
      {
          "client": "UPTOWN EASTGATE BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "VETTING FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 140000
      },
      {
          "client": "UPTOWN EASTGATE BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "VETTING FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 140000
      },
      {
          "client": "ONE MADISON PLACE CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 140000
      },
      {
          "client": "KNACK GLOBAL PHILIPPINES, INC.",
          "areaManager": "LYKA",
          "serviceType": "VETTING FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 140000
      },
      {
          "client": "ST. HONORE & ST. DOMINIQUE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "LYKA",
          "serviceType": "AC CLEANING",
          "agingBucket": "1-30 days",
          "remainingBalance": 136640
      },
      {
          "client": "BRYANT PARKLANE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 136563.54
      },
      {
          "client": "THE PINNACLE ILOILO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 134400
      },
      {
          "client": "THE PINNACLE ILOILO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 134400
      },
      {
          "client": "MCKINLEY WEST CAMPUS BUILDING ADMINISTRATION, INC.",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 133906.16
      },
      {
          "client": "MEGWORLD CORPORATION FAO: ILOILO BUSINESS PARK SALES AND INFORMATION CENTER",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 130360
      },
      {
          "client": "MREIT FUND MANAGERS, INC.",
          "areaManager": "RALPH",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 125999.98
      },
      {
          "client": "NO. 1 UPPER EAST AVENUE BUILDING ADMINISTRATION INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 121333.28
      },
      {
          "client": "LA CASSIA RESIDENCES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 120752.9
      },
      {
          "client": "CXLOYALTY TRAVEL SERVICES PHILIPPINES",
          "areaManager": "CEZAR",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "1-30 days",
          "remainingBalance": 120000
      },
      {
          "client": "MEGAWORLD RESORT ESTATES, INC. FAO: ARCOVIA CITY SHOWROOM & EASTWOOD CITY SHOWROOM",
          "areaManager": "ANGIE",
          "serviceType": "FACILITIES MGMT",
          "agingBucket": "31-60 days",
          "remainingBalance": 113460.59
      },
      {
          "client": "ENTERPRISE TWO BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 112000
      },
      {
          "client": "LA CASSIA RESIDENCES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 112000
      },
      {
          "client": "ENTERPRISE TWO BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 112000
      },
      {
          "client": "LA CASSIA RESIDENCES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 112000
      },
      {
          "client": "TWO REGIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 112000
      },
      {
          "client": "ENTERPRISE TWO BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 112000
      },
      {
          "client": "TWO REGIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 112000
      },
      {
          "client": "ST MORITZ PRIVATE ESTATE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 98784
      },
      {
          "client": "ST MORITZ PRIVATE ESTATE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 98784
      },
      {
          "client": "CHELSEA PARKPLACE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 97631.18
      },
      {
          "client": "CHELSEA PARKPLACE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 97631.18
      },
      {
          "client": "CHELSEA PARKPLACE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 97631.18
      },
      {
          "client": "THE ELLIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 97020
      },
      {
          "client": "THE ELLIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 97020
      },
      {
          "client": "THE ELLIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 97020
      },
      {
          "client": "TWO FINTECH PLACE BUILDING ADMINISTRATION INC.",
          "areaManager": "RALPH",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "61-90 days",
          "remainingBalance": 95137.2
      },
      {
          "client": "ONE CORPORATE PLACE BUILDING ADMINISTRATION INC",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 92400
      },
      {
          "client": "THE VERDIN AT MAPLE GROVE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 92400
      },
      {
          "client": "ONE CORPORATE PLACE BUILDING ADMINISTRATION INC",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 92400
      },
      {
          "client": "THE VERDIN AT MAPLE GROVE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 92400
      },
      {
          "client": "ONE CORPORATE PLACE CONDOMINIUM CORPORATION",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 92400
      },
      {
          "client": "THE VERDIN AT MAPLE GROVE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 92400
      },
      {
          "client": "MEGAWORLD CORPORATION FAO:MACTAN NEWTOWN SALES AND INFORMATION CENTER",
          "areaManager": "LYKA",
          "serviceType": "FACILITIES MGMT",
          "agingBucket": "1-30 days",
          "remainingBalance": 88467.62
      },
      {
          "client": "WORLDWIDE PLAZA BUILDING ADMINISTRATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 86339.29
      },
      {
          "client": "TARAVEZA CONSTRUCTION CORPORATION",
          "areaManager": "ANGIE",
          "serviceType": "VETTING FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 84000
      },
      {
          "client": "MEGAWORLD CORPORATION FAO: UPPER EAST HOUSE SHOWROOM",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "1-30 days",
          "remainingBalance": 83543.03
      },
      {
          "client": "ONE PASEO BUILDING ADMINISTRATION INC",
          "areaManager": "CEZAR",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": 82555.2
      },
      {
          "client": "MICROSOURCING PHILIPPINES, INC.",
          "areaManager": "ANGIE",
          "serviceType": "VETTING FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 75000
      },
      {
          "client": "THE ALBANY LUXURY RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 73040
      },
      {
          "client": "MEGAWORLD CORPORATION:UEG/IBP",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "31-60 days",
          "remainingBalance": 71377.6
      },
      {
          "client": "ONE FINTECH BUILDING ADMINISTRATION INC",
          "areaManager": "RALPH",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 71013.25
      },
      {
          "client": "CHELSEA PARKPLACE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 61069.06
      },
      {
          "client": "THE PALLADIUM CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "AC CLEANING",
          "agingBucket": "61-90 days",
          "remainingBalance": 56628
      },
      {
          "client": "ONE PASEO BUILDING ADMINISTRATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 55016.17
      },
      {
          "client": "MREIT, INC. MWC",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "1-30 days",
          "remainingBalance": 53884
      },
      {
          "client": "LAFAYETTE PARK SQUARE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "JANINE",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 51665.57
      },
      {
          "client": "MEGAWORLD CORPORATION FAO: MCKINLEY HILL INFORMATION CENTER",
          "areaManager": "KING",
          "serviceType": "FACILITIES MGMT",
          "agingBucket": "91 days above",
          "remainingBalance": 47040
      },
      {
          "client": "THE VERDIN AT MAPLE GROVE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "NORIEL",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 45158.4
      },
      {
          "client": "UPTOWN ARTS RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "91 days above",
          "remainingBalance": 43447.64
      },
      {
          "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
          "areaManager": "LYKA",
          "serviceType": "AC CLEANING",
          "agingBucket": "1-30 days",
          "remainingBalance": 43280
      },
      {
          "client": "MEGAWORLD CORPORATION FAO: MCKINLEY HILL INFORMATION CENTER",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": 42693.27
      },
      {
          "client": "BAYSHORE RESIDENTIAL RESORT 2 ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "AC CLEANING",
          "agingBucket": "31-60 days",
          "remainingBalance": 40880
      },
      {
          "client": "UPTOWN EASTGATE BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 39732.14
      },
      {
          "client": "MEGAWORLD CORPORATION FAO: UPPER EAST HOUSE SHOWROOM",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "1-30 days",
          "remainingBalance": 39000
      },
      {
          "client": "BUILDSWORTH CONSTRUCTION",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "31-60 days",
          "remainingBalance": 37500
      },
      {
          "client": "INTERNATIONAL FINANCE CENTER BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 35280
      },
      {
          "client": "LA CASSIA RESIDENCES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 33525.5
      },
      {
          "client": "LAFAYETTE PARK SQUARE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "JANINE",
          "serviceType": "AC CLEANING",
          "agingBucket": "31-60 days",
          "remainingBalance": 33402.88
      },
      {
          "client": "LAFAYETTE PARK SQUARE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "JANINE",
          "serviceType": "AC CLEANING",
          "agingBucket": "1-30 days",
          "remainingBalance": 33402.88
      },
      {
          "client": "CONVERGE INFORMATION AND COMMUNICATIONS TECHNOLOGY",
          "areaManager": "CEZAR",
          "serviceType": "VETTING FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 29772.73
      },
      {
          "client": "MEGAWORLD CORPORATION FAO:MACTAN NEWTOWN SALES AND INFORMATION CENTER",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "1-30 days",
          "remainingBalance": 29272.32
      },
      {
          "client": "FORBES HILL HOMEOWNERS ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 27237.68
      },
      {
          "client": "THE VERDIN AT MAPLE GROVE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 24005.97
      },
      {
          "client": "THE VERDIN AT MAPLE GROVE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": 24005.97
      },
      {
          "client": "THE VERDIN AT MAPLE GROVE CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 24005.97
      },
      {
          "client": "DACARA, ANGEL MARK AUSTRIA",
          "areaManager": "LYKA",
          "serviceType": "VETTING FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 18368
      },
      {
          "client": "SPECTROPLUS CONSTRUCTION SERVICES",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 17920
      },
      {
          "client": "LIGHT AND WONDER SERVICE PHILIPPINES INC.",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "31-60 days",
          "remainingBalance": 15904
      },
      {
          "client": "PASUDECO TOWER BUILDING ADMINISTRATION, INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "91 days above",
          "remainingBalance": 13485.11
      },
      {
          "client": "ONE CORPORATE PLACE BUILDING ADMINISTRATION INC",
          "areaManager": "NORIEL",
          "serviceType": "AC CLEANING",
          "agingBucket": "61-90 days",
          "remainingBalance": 10752
      },
      {
          "client": "NO. 1 UPPER EAST AVENUE BUILDING ADMINISTRATION INC.",
          "areaManager": "LYKA",
          "serviceType": "AC CLEANING",
          "agingBucket": "1-30 days",
          "remainingBalance": 10752
      },
      {
          "client": "BAYSHORE RESIDENTIAL RESORT 2 ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 10535.71
      },
      {
          "client": "UPTOWN PARKSUITES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "1-30 days",
          "remainingBalance": 10535.71
      },
      {
          "client": "UPTOWN PARKSUITES CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ROWENA",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": 9520.01
      },
      {
          "client": "ELVORA CORP.",
          "areaManager": "NORIEL",
          "serviceType": "VETTING FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 7616
      },
      {
          "client": "MC BUILDERS AND SUPPLIES INC.",
          "areaManager": "NORIEL",
          "serviceType": "VETTING FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": 7616
      },
      {
          "client": "GOODEATS FOOD SUPPLY TRADING",
          "areaManager": "LYKA",
          "serviceType": "VETTING FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 7504
      },
      {
          "client": "IO GROUP INC.",
          "areaManager": "NORIEL",
          "serviceType": "VETTING FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": 7504
      },
      {
          "client": "GECO PHILIPPINES INC",
          "areaManager": "LYKA",
          "serviceType": "VETTING FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 7280
      },
      {
          "client": "CITYFRONT BUILDING ADMINISTRATION INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 5088.69
      },
      {
          "client": "JK Food and Restaurant, OPC",
          "areaManager": "LYKA",
          "serviceType": "VETTING FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 4928
      },
      {
          "client": "FALLORIN, REGINA CUENCA",
          "areaManager": "LYKA",
          "serviceType": "VETTING FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 3864
      },
      {
          "client": "GENTRY MANOR CONDOMINIUM ASSOCIATION INC",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": 3210
      },
      {
          "client": "TRENDS AND CONCEPTS TOTAL INTERIOR SOLUTIONS, INC.",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "31-60 days",
          "remainingBalance": 3160
      },
      {
          "client": "ONG, MANUELETTE GO",
          "areaManager": "LYKA",
          "serviceType": "VETTING FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": 2912
      },
      {
          "client": "Jinky Jalandoni Cope",
          "areaManager": "LYKA",
          "serviceType": "VETTING FEE",
          "agingBucket": "91 days above",
          "remainingBalance": 2912
      },
      {
          "client": "BAYSHORE RESIDENTIAL RESORT 2 ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 2786.97
      },
      {
          "client": "THE LEAD TREE INT CORP",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": 2518.15
      },
      {
          "client": "ONE PASEO BUILDING ADMINISTRATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA- ADVANCES",
          "agingBucket": "91 days above",
          "remainingBalance": 60.71
      },
      {
          "client": "WORLDWIDE PLAZA BUILDING ADMINISTRATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 0.19
      },
      {
          "client": "MAKATI SAN ANTONIO RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "ROWENA",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "61-90 days",
          "remainingBalance": 0.04
      },
      {
          "client": "MEGAWORLD RESORT ESTATES, INC. FAO: ARCOVIA CITY SHOWROOM & EASTWOOD CITY SHOWROOM",
          "areaManager": "ANGIE",
          "serviceType": "FACILITIES MGMT",
          "agingBucket": "91 days above",
          "remainingBalance": 0.02
      },
      {
          "client": "THE PALLADIUM CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": 0.02
      },
      {
          "client": "18 AVENUE DE TRIOMPHE CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 0.02
      },
      {
          "client": "MREIT PROPERTY MANAGERS, INC.",
          "areaManager": "RALPH",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 0.02
      },
      {
          "client": "ST. HONORE & ST. DOMINIQUE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 0.01
      },
      {
          "client": "THE PALLADIUM CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 0.01
      },
      {
          "client": "MAKATI SAN ANTONIO RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "ROWENA",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 0.01
      },
      {
          "client": "JAVIER PROJECT MANAGERS INC",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "61-90 days",
          "remainingBalance": 0.01
      },
      {
          "client": "THE ALBANY LUXURY RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": 0.01
      },
      {
          "client": "UPTOWN PLACE BUILDING ADMINISTRATION, INC.",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": 0.01
      },
      {
          "client": "MEGAWORLD RESORT ESTATES, INC. FAO: ARCOVIA CITY SHOWROOM & EASTWOOD CITY SHOWROOM",
          "areaManager": "ANGIE",
          "serviceType": "FACILITIES MGMT",
          "agingBucket": "61-90 days",
          "remainingBalance": 0.01
      },
      {
          "client": "MAKATI SAN ANTONIO RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 0.01
      },
      {
          "client": "MEGAWORLD CORPORATION:UEG/IBP",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": 0.01
      },
      {
          "client": "TWO REGIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": 0.01
      },
      {
          "client": "INTERNATIONAL FINANCE CENTER BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -0.01
      },
      {
          "client": "ST MORITZ PRIVATE ESTATE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -0.01
      },
      {
          "client": "LAFAYETTE PARK SQUARE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -0.01
      },
      {
          "client": "MAKATI SAN ANTONIO RESIDENCE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "ROWENA",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": -0.01
      },
      {
          "client": "PARK MCKINLEY WEST CONDOMINIUM ASSOCIATION INC",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -0.01
      },
      {
          "client": "ONE PASEO BUILDING ADMINISTRATION INC",
          "areaManager": "CEZAR",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -0.01
      },
      {
          "client": "CTRL CONSTRUCTION, CORP",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": -0.01
      },
      {
          "client": "MEGAWORLD CORPORATION : Maple Grove Park Village",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -0.01
      },
      {
          "client": "MAPLE GROVE COMMERCIAL DISTRICT ESTATE",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -0.01
      },
      {
          "client": "INTERNATIONAL CORPORATE PLAZA CONDOMINIUM CORP.",
          "areaManager": "LYKA",
          "serviceType": "AC CLEANING",
          "agingBucket": "91 days above",
          "remainingBalance": -0.01
      },
      {
          "client": "PALVER BUILDERS AND LANDSCAPING",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": -0.01
      },
      {
          "client": "ENTERPRISE ONE BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": -0.01
      },
      {
          "client": "THE PALLADIUM CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": -0.01
      },
      {
          "client": "LAFAYETTE PARK SQUARE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "61-90 days",
          "remainingBalance": -0.01
      },
      {
          "client": "ONE REGIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": -0.01
      },
      {
          "client": "TUSCANY PRIVATE ESTATE CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "HARVEY",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": -0.01
      },
      {
          "client": "SUNNY COAST RESIDENTIAL RESORT CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": -0.01
      },
      {
          "client": "ENTERPRISE ONE BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": -0.01
      },
      {
          "client": "THE PALLADIUM CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": -0.01
      },
      {
          "client": "LAFAYETTE PARK SQUARE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": -0.01
      },
      {
          "client": "ONE REGIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "31-60 days",
          "remainingBalance": -0.01
      },
      {
          "client": "MCKINLEY WEST CAMPUS BUILDING ADMINISTRATION, INC.",
          "areaManager": "KING",
          "serviceType": "AC CLEANING",
          "agingBucket": "31-60 days",
          "remainingBalance": -0.01
      },
      {
          "client": "ENTERPRISE ONE BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": -0.01
      },
      {
          "client": "LAFAYETTE PARK SQUARE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "1-30 days",
          "remainingBalance": -0.01
      },
      {
          "client": "ONE REGIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": -0.01
      },
      {
          "client": "SALEMAIRE INDUSTRIES CORP.",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "1-30 days",
          "remainingBalance": -0.01
      },
      {
          "client": "SUNNY COAST RESIDENTIAL RESORT CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": -0.01
      },
      {
          "client": "MAPLE GROVE COMMERCIAL DISTRICT ESTATE",
          "areaManager": "NORIEL",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "1-30 days",
          "remainingBalance": -0.01
      },
      {
          "client": "GENESIS PLUMBING AND FIRE PROTECTION INC.",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "Current",
          "remainingBalance": -0.01
      },
      {
          "client": "DAV DEVELOPMENT AND CONTRUCTION CORPORATION",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "Current",
          "remainingBalance": -0.01
      },
      {
          "client": "ONE REGIS CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -0.02
      },
      {
          "client": "ARCOVIA PALAZZO CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "ANGIE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "61-90 days",
          "remainingBalance": -0.02
      },
      {
          "client": "UPTOWN EASTGATE BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -0.03
      },
      {
          "client": "THE PALLADIUM CONDOMINIUM ASSOCIATION INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -0.04
      },
      {
          "client": "ENTERPRISE ONE BUILDING ADMINISTRATION, INC.",
          "areaManager": "LYKA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -0.06
      },
      {
          "client": "LAFAYETTE PARK SQUARE CONDOMINIUM ASSOCIATION INC",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": -0.08
      },
      {
          "client": "FC DINO CONSTRUCTION",
          "areaManager": "KING",
          "serviceType": "AD HOC/AC REPAIRS",
          "agingBucket": "91 days above",
          "remainingBalance": -337.06
      },
      {
          "client": "ONE MADISON PLACE CONDOMINIUM ASSOCIATION, INC.",
          "areaManager": "JANINE",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "31-60 days",
          "remainingBalance": -3046.88
      },
      {
          "client": "GENTRY MANOR CONDOMINIUM ASSOCIATION INC",
          "areaManager": "ROWENA",
          "serviceType": "PMA - STAFF COST",
          "agingBucket": "91 days above",
          "remainingBalance": -3210
      },
      {
          "client": "INTERNATIONAL FINANCE CENTER BUILDING ADMINISTRATION INC.",
          "areaManager": "CEZAR",
          "serviceType": "PMA - MNGMT FEE",
          "agingBucket": "91 days above",
          "remainingBalance": -31500
      }
  ]
};
