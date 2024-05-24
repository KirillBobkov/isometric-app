import React, { useState, useEffect, SyntheticEvent, ReactNode } from "react";
import { Observable, Subscription, interval } from "rxjs";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
// Typing for TabPanel props
interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}
// Mock function to simulate Bluetooth connection and data stream.
export function connect(): Observable<any> {
  console.log("Connecting to Bluetooth...");
  return interval(1000);
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div>
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const FitnessApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [subscription, setSubscription] = useState<Subscription | undefined>(
    undefined
  );
  const [isMaxTrainingActive, setIsMaxTrainingActive] =
    useState<boolean>(false);
  const [trainingData, setTrainingData] = useState<number[]>([]);
  const [maxTrainingValue, setMaxTrainingValue] = useState<number>(0);
  const [currentValue, setCurrentValue] = useState<number | undefined>(
    undefined
  );
  const handleTabChange = (event: SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  const handleConnect = () => {
    const newSubscription = connect().subscribe((value: any) => {
      setCurrentValue(value * 10);
    });
    setSubscription(newSubscription);
  };
  const handleDisconnect = () => {
    subscription?.unsubscribe();
    setSubscription(undefined);
  };
  useEffect(() => {
    if (isMaxTrainingActive && currentValue !== undefined) {
      setTrainingData((prevData: number[]) => [...prevData, currentValue]);
    }
  }, [currentValue, isMaxTrainingActive]);
  const startMaxTraining = () => {
    setIsMaxTrainingActive(true);
    setMaxTrainingValue(0);
  };
  const stopMaxTraining = () => {
    setIsMaxTrainingActive(false);
    const maxValue = Math.max(...trainingData);
    setMaxTrainingValue(maxValue);
  };
  return (
    <Box sx={{ width: "100%" }}>
      <Box
        display="flex"
        alignItems="center"
        gap={4}
        p={2}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Button variant="contained" onClick={handleConnect}>
          Подключиться по Bluetooth
        </Button>
        <Button variant="contained" onClick={handleDisconnect}>
          Отключиться
        </Button>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          centered
          value={currentTab}
          onChange={handleTabChange}
          aria-label="basic tabs example"
        >
          <Tab label="Режим тренировки" />
          <Tab label="Режим определения максимума" />
        </Tabs>
      </Box>
      <TabPanel value={currentTab} index={0}>
        <Button variant="contained" onClick={handleConnect}>
          Начать тренировку
        </Button>
      </TabPanel>
      <TabPanel value={currentTab} index={1}>
        {isMaxTrainingActive ? (
          <Button color="error" variant="contained" onClick={stopMaxTraining}>
            Стоп
          </Button>
        ) : (
          <Button
            color="success"
            variant="contained"
            onClick={startMaxTraining}
          >
            Определить максимум
          </Button>
        )}
        <LineChart
          series={[
            {
              data: trainingData,
            },
          ]}
          width={500}
          height={500}
        />
        {maxTrainingValue > 0 && (
          <Box component="section" sx={{ p: 2 }}>
            <Typography>Максимальное значение: {maxTrainingValue}</Typography>
          </Box>
        )}
      </TabPanel>
    </Box>
  );
};
export default FitnessApp;
