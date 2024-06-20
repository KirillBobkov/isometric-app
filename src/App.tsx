import React, { useState, useEffect, useCallback } from "react";
import styles from "./App.module.css";
import { Button, IconButton, ThemeProvider, Tooltip, createTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { Subscription } from "rxjs";
import { connect, disconnect, getStatus, read } from "./connect";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { useGaugeState } from "@mui/x-charts/Gauge";
import { fromEvent, interval } from "rxjs";
import { mapTo, scan, startWith, tap } from "rxjs/operators";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import BluetoothRoundedIcon from "@mui/icons-material/BluetoothRounded";
import BluetoothDisabledRoundedIcon from "@mui/icons-material/BluetoothDisabledRounded";
import avatar from "./avatar.png";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";

const INITIAL_COUNT = 0;

// Функция для создания Observable счётчика
export function createCounterObservable() {
  // Создаём поток интервалов, который будет увеличивать значение счётчика каждую секунду
  const counter$ = interval(1000).pipe(
    // Используем scan для накопления значений
    scan((acc, _) => acc + 1),
    // Начинаем с начального значения
    startWith(INITIAL_COUNT)
  );

  return counter$;
}

function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600); // Часы
  seconds %= 3600; // Остаток от деления на 3600 (минуты)

  const minutes = Math.floor(seconds / 60); // Минуты
  seconds %= 60; // Секунды

  return `${("0" + hours).slice(-2)}:${("0" + minutes).slice(-2)}:${("0" + seconds).slice(-2)}`;
}

export const App: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | undefined>(undefined);
  const [counterSub, setCounterSub] = useState<Subscription | undefined>(undefined);
  const [currentValue, setCurrentValue] = useState<number | undefined>(undefined);
  const connected = !getStatus();

  const [usualTrainingStarted, setUsualTrainingStarted] = useState<boolean>(false);
  const [maxTrainingStarted, setMaxTrainingStarted] = useState<boolean>(false);

  const [usualTrainingData, setUsualTrainingData] = useState<number[]>([]);
  const [maxTrainingData, setMaxTrainingData] = useState<number[]>([]);


  const [value, setValue] = React.useState(1);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleConnect = useCallback(() => {
    const newSubscription = connect().subscribe((value: any) => {
      setCurrentValue(+value || 0);
    });
    setSubscription(newSubscription);
  }, [connected]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    subscription?.unsubscribe();
    setSubscription(undefined);
    counterSub?.unsubscribe();
    setCounterSub(undefined);
  }, [subscription, counterSub]);

  useEffect(() => {
    if (currentValue !== undefined) {

      if (usualTrainingStarted) {
        setUsualTrainingData((prevData) => (prevData.length >= 20 ? [...prevData.slice(1), currentValue] : [...prevData, currentValue]));
      }
    
      if (maxTrainingStarted) {
        setMaxTrainingData((prevData) => (prevData.length >= 20 ? [...prevData.slice(1), currentValue] : [...prevData, currentValue]));
      }
    }
  }, [currentValue]);

  const newTheme = createTheme({ palette: { mode: "dark" } });
  return (
    <ThemeProvider theme={newTheme}>
      <div className={styles.layout}>
        <div className={`${styles.column} ${styles.columnLeft}`}>
          <div className={styles.title} style={{ width: "100%" }}>
            Изометрический тренажёр
          </div>
          <div style={{ marginTop: "30px" }}></div>
          <div className={styles.container_buttons}>
            <h1 className={styles.secondary_title}>
              Управление Bluetooth{" "}
              <Tooltip title="Самый первый шаг - подключить устройство. Далее уже можно выбирать режим тренировки. Если тренажёр не подключен, то режимы тренировки недоступны">
                <IconButton>
                  <InfoRoundedIcon />
                </IconButton>
              </Tooltip>
            </h1>

            {!connected ? (
              <h1 className={styles.status}>
                <BluetoothDisabledRoundedIcon />
                <span>Отключено</span>
              </h1>
            ) : (
              <h1 className={styles.status}>
                <BluetoothRoundedIcon />
                <span>Подключено</span>
              </h1>
            )}
            <div className={styles.buttons}>
              <Button variant="contained" style={{ borderRadius: 30, backgroundColor: "#65ceff" }} onClick={handleConnect}>
                Подключить
              </Button>
              <Button variant="outlined" style={{ borderRadius: 30, borderColor: "#65ceff", color: "#65ceff" }} onClick={handleDisconnect}>
                Отключить
              </Button>
            </div>
          </div>
        </div>
        <div className={`${styles.column} ${styles.columnCenter}`}>
          <Box style={{ marginBottom: 30 }} sx={{ width: "100%" }}>
            <Tabs
              value={value}
              onChange={handleChangeTab}
              textColor="secondary"
              indicatorColor="secondary"
              aria-label="secondary tabs example"
              centered
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "transparent",
                },
              }}
            >
              <Tab
                sx={{
                  "&.Mui-selected": {
                    color: "#000",
                    backgroundColor: "#65ceff",
                    borderRadius: 30,
                  },
                  "&.Mui-focusVisible": {
                    backgroundColor: "#65ceff",
                  },
                }}
                value={1}
                label="Режим обычной тренировки"
              />
              <Tab
                sx={{
                  "&.Mui-selected": {
                    color: "#000",
                    backgroundColor: "#65ceff",
                    borderRadius: 30,
                  },
                  "&.Mui-focusVisible": {
                    backgroundColor: "#65ceff",
                  },
                }}
                value={2}
                label="Режим определения максимума"
              />
            </Tabs>
          </Box>

          {value === 1 ? (
            <>
              <div className={styles.charts}>
                <ChartComponent title="График для обычной тренировки" data={usualTrainingData.map((v) => v)} />
              </div>
              <div style={{ marginTop: "30px" }}></div>
              <div className={styles.buttons}>
                <Button
                disabled={!connected || maxTrainingStarted || usualTrainingStarted}
                  variant="contained"
                  style={{ borderRadius: 30, backgroundColor: "#65ceff" }}
                  sx={{
                    "&.Mui-disabled": {
                      opacity: 0.3,
                    },
                  }}
                  onClick={() => { setUsualTrainingStarted(true);  }}
                >
                  Старт
                </Button>
                <Button
                  disabled={!connected || maxTrainingStarted ||  !usualTrainingStarted}
                  variant="outlined"
                  style={{ borderRadius: 30, borderColor: "#65ceff", color: "#65ceff" }}
                  sx={{
                    "&.Mui-disabled": {
                      opacity: 0.3,
                    },
                  }}
                  onClick={() => { setUsualTrainingStarted(false);  }}
                >
                  Стоп
                </Button>
              </div>
            </>
          ) : null}

          {value === 2 ? (
            <>
              <div className={styles.charts}>
                <ChartComponent title="График для определения максимума" data={maxTrainingData.map((v) => v)} />
              </div>
              <div style={{ marginTop: "30px" }}></div>
              <div className={styles.buttons}>
                <Button
                  disabled={!connected || usualTrainingStarted || maxTrainingStarted}
                  variant="contained"
                  style={{ borderRadius: 30, backgroundColor: "#65ceff" }}
                  sx={{
                    "&.Mui-disabled": {
                      opacity: 0.3,
                    },
                  }}
                  onClick={() => { setMaxTrainingStarted(true); }}
                >
                  Старт
                </Button>
                <Button
                  disabled={!connected || usualTrainingStarted || !maxTrainingStarted}
                  variant="outlined"
                  style={{ borderRadius: 30, borderColor: "#65ceff", color: "#65ceff" }}
                  sx={{
                    "&.Mui-disabled": {
                      opacity: 0.3,
                    },
                  }}
                  onClick={() => { setMaxTrainingStarted(false); }}
                >
                  Стоп
                </Button>
              </div>
            </>
          ) : null}
        </div>
        <div className={`${styles.column} ${styles.columnRight}`}>
          <SaveData connected={connected} />
        </div>
      </div>
    </ThemeProvider>
  );
};
interface ChartComponentProps {
  title: string;
  data: number[];
}
const ChartComponent: React.FC<ChartComponentProps> = ({ title, data }) => (
  <div className={styles.container_chart}>
    <h1 className={styles.secondary_title}>{title}</h1>
    <LineChart
      margin={{
        left: 40,
        right: 10,
        top: 0,
        bottom: 20,
      }}
      series={[
        {
          data: data,
          showMark: false,
          disableHighlight: true,
          connectNulls: true,
          color: "#65ceff",
        },
      ]}
    />
  </div>
);

const SaveData = ({ connected }: any) => (
  <div>
    <div className={styles.title_2} style={{ width: "100%", marginBottom: 30 }}>
      Сохранение / Восстановление
      <Tooltip title="Данные сохраняются в формате Excel таблицы с двумя листами: на первом листе будут сохраняться данные обычной тренировки; на втором листе будет сохраняться данные максимальных значений">
        <IconButton>
          <InfoRoundedIcon />
        </IconButton>
      </Tooltip>
    </div>
    <div style={{ marginTop: "30px" }}></div>
    <div className={styles.buttons} style={{ flexDirection: "column" }}>
      <Button
        disabled={!connected}
        variant="contained"
        style={{ borderRadius: 30, backgroundColor: "#65ceff" }}
        sx={{
          "&.Mui-disabled": {
            opacity: 0.3,
          },
        }}
        onClick={() => {}}
      >
        Скачать данные
      </Button>
      <Button
        disabled={!connected}
        variant="outlined"
        style={{ borderRadius: 30, borderColor: "#65ceff", color: "#65ceff" }}
        sx={{
          "&.Mui-disabled": {
            opacity: 0.3,
          },
        }}
        onClick={() => {}}
      >
        Загрузить данные
      </Button>
    </div>
  </div>
);

function GaugePointer() {
  const { valueAngle, outerRadius, cx, cy } = useGaugeState();

  if (valueAngle === null) {
    // No value to display
    return null;
  }

  const target = {
    x: cx + outerRadius * Math.sin(valueAngle),
    y: cy - outerRadius * Math.cos(valueAngle),
  };
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="red" />
      <path d={`M ${cx} ${cy} L ${target.x} ${target.y}`} stroke="red" strokeWidth={3} />
    </g>
  );
}

function CompositionExample({ val }: any) {
  return (
    <Gauge
      value={val}
      startAngle={-110}
      endAngle={110}
      sx={{
        [`& .${gaugeClasses.valueText}`]: {
          fontSize: 30,
          transform: "translate(0px, 0px)",
        },
        [`& .${gaugeClasses.valueArc}`]: {
          fill: "#65ceff",
        },
      }}
      text={({ value, valueMax }) => `${value}%`}
    />
  );
}
