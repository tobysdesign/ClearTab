import React from "react";

import { WidgetContainer, WidgetHeader, WidgetContent } from "@cleartab/ui";

// Placeholder weather widget for extension
// Will be implemented with actual weather functionality later
export const ExtensionWeatherWidget: React.FC = () => {
  return (
    <div className="extension-widget">
      <WidgetContainer>
        <WidgetHeader title="Weather" />
        <WidgetContent>
          <div className="weather-info">
            <div className="temp">72°F</div>
            <div className="condition">Sunny</div>
            <div className="location">San Francisco</div>
          </div>
        </WidgetContent>
      </WidgetContainer>
    </div>
  );
};
