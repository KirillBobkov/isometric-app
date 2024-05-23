import * as React from "react";
import { pipe, tap } from 'rxjs'; 
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { connect } from "./connect";
import { Button } from "@mui/material";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

export default function BasicTabs() {
  const [value, setValue] = React.useState(0);
  const mount = React.useRef(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleConnect = () => {
      connect().subscribe((a) => {
        mount.current = true;
        console.log(a);
      })
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Button variant="contained" onClick={handleConnect}>Connect</Button>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs centered value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Режим тренировки" />
          <Tab label="Режим определения максимума" disabled/>
        </Tabs>
      </Box>

      <CustomTabPanel value={value} index={0}>
        Item One
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        Item Two
      </CustomTabPanel>
    </Box>
  );
}
