import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { Howl, Howler } from "howler";
import axios from "axios";

export const App = () => {
  const [connected, setConnected] = useState(true);
  const [trainingInProgress, setTrainingInProgress] = useState(""); // usual or max
  const [trainingMode, setTrainingMode] = useState("usual"); // usual or max
  const [usualData, setUsualData] = useState<number[]>([]);
  const [maxData, setMaxData] = useState<number[]>([]);
  const [lastValueFromBluetooth, setLastValueFromBluetooth] = useState(0);
  const [subscription, setSubscription] = useState<Subscription | undefined>(undefined);

  const gaugeRef = React.useRef(null);

  const onConnect = useCallback(() => {
    // @ts-ignore
    const newSubscription: Subscription = connect().subscribe((value: any) => {
      setLastValueFromBluetooth(value);
    });
    setSubscription(newSubscription);
  }, []);

  const onDisconnect = useCallback(() => {
    disconnect();
    subscription?.unsubscribe();
    setTrainingInProgress("");
    // ??
    setUsualData([]);
    setMaxData([]);

    setLastValueFromBluetooth(0);
  }, [subscription]);

  useEffect(() => {
    if (lastValueFromBluetooth) {
      if (trainingInProgress === "usual") {
        setUsualData((prev) => [...prev.slice(-20), lastValueFromBluetooth]);
      } else if (trainingInProgress === "max") {
        setMaxData((prev) => [...prev.slice(-20), lastValueFromBluetooth]);
      }
    }
  }, [lastValueFromBluetooth, trainingMode, trainingInProgress]);

  useEffect(() => {
    if (connected) {
      onConnect();
    } else {
      onDisconnect();
    }
  }, [connected]);

  const onChangeTrainingMode = (event: any, newValue: string) => {
    console.log(newValue);
    setTrainingMode(newValue);
  };

  const startTraining = async () => {
    setTrainingInProgress(trainingMode);
    const sound = new Howl({
      src: [require(`./sounds/${trainingMode === 'usual' ? 'usual_started.mp3' : 'max_started.mp3'}`)],
    });
    sound.play();
  };

  const stopTraining = () => {
    setTrainingInProgress("");

    const sound = new Howl({
      src: [require("./sounds/finish.mp3")],
    });
    sound.play();
  };

  const newTheme = createTheme({ palette: { mode: "dark" } });

  return (
    <ThemeProvider theme={newTheme}>
      <div className={styles.layout}>
        <div className={`${styles.column} ${styles.columnLeft}`}>
          <div className={styles.title} style={{ width: "100%" }}>
            Изометрический тренажёр
          </div>

          <div className={styles.container_buttons}>
            <h1 className={styles.secondary_title}>
              Управление Bluetooth
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
              <Button variant="contained" style={{ borderRadius: 30, backgroundColor: "#65ceff" }} onClick={onConnect}>
                Подключить
              </Button>
              <Button variant="outlined" style={{ borderRadius: 30, borderColor: "#65ceff", color: "#65ceff" }} onClick={onDisconnect}>
                Отключить
              </Button>
            </div>
          </div>
        </div>
        <div className={`${styles.column} ${styles.columnCenter}`}>
          <Box style={{ marginBottom: 30 }} sx={{ width: "100%" }}>
            <Tabs
              value={trainingMode}
              onChange={onChangeTrainingMode}
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
                value={"usual"}
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
                value={"max"}
                label="Режим определения максимума"
              />
            </Tabs>
          </Box>

          {trainingMode === "usual" ? (
            <>
              <div className={styles.charts}>
                <ChartComponent title="График для обычной тренировки" data={usualData.map((v) => v)} />
              </div>
              <div style={{ marginTop: "30px" }}></div>
              <div className={styles.buttons}>
                <Button
                  disabled={!connected || trainingInProgress === "max" || trainingInProgress === "usual"}
                  variant="contained"
                  style={{ borderRadius: 30, backgroundColor: "#65ceff" }}
                  sx={{
                    "&.Mui-disabled": {
                      opacity: 0.3,
                    },
                  }}
                  onClick={() => {
                    startTraining();
                  }}
                >
                  Старт
                </Button>
                <Button
                  disabled={!connected || trainingInProgress !== "usual"}
                  variant="outlined"
                  style={{ borderRadius: 30, borderColor: "#65ceff", color: "#65ceff" }}
                  sx={{
                    "&.Mui-disabled": {
                      opacity: 0.3,
                    },
                  }}
                  onClick={() => {
                    stopTraining();
                  }}
                >
                  Стоп
                </Button>
              </div>
            </>
          ) : null}

          {trainingMode === "max" ? (
            <>
              <div className={styles.charts}>
                <ChartComponent title="График для определения максимума" data={maxData.map((v) => v)} />
              </div>
              <div style={{ marginTop: "30px" }}></div>
              <div className={styles.buttons}>
                <Button
                  disabled={!connected || trainingInProgress === "max" || trainingInProgress === "usual"}
                  variant="contained"
                  style={{ borderRadius: 30, backgroundColor: "#65ceff" }}
                  sx={{
                    "&.Mui-disabled": {
                      opacity: 0.3,
                    },
                  }}
                  onClick={() => {
                    startTraining();
                  }}
                >
                  Старт
                </Button>
                <Button
                  disabled={!connected || trainingInProgress !== "max"}
                  variant="outlined"
                  style={{ borderRadius: 30, borderColor: "#65ceff", color: "#65ceff" }}
                  sx={{
                    "&.Mui-disabled": {
                      opacity: 0.3,
                    },
                  }}
                  onClick={() => {
                    stopTraining();
                  }}
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
