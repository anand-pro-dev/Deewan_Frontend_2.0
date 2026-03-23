// react plugin for creating vector maps
import { VectorMap } from "@react-jvectormap/core";
import { inMill } from "@react-jvectormap/india"; // Import India map

// Define the component props
interface CountryMapProps {
  mapColor?: string;
}

const CountryMap: React.FC<CountryMapProps> = ({ mapColor }) => {
  return (
    <VectorMap
      map={inMill} // Changed from worldMill to inMill for India map
      backgroundColor="transparent"
      markerStyle={{
        initial: {
          fill: "#465FFF",
          r: 5,
          stroke: "white",
          strokeWidth: 2,
        } as any, // Type assertion to bypass strict CSS property checks
        hover: {
          r: 7,
          cursor: "pointer",
        } as any,
      }}
      markersSelectable={true}
      markers={[
        {
          latLng: [19.0760, 72.8777], // Mumbai
          name: "Mumbai",
          style: {
            fill: "#3B82F6",
            stroke: "#1E3A8A",
          } as any,
        },
        {
          latLng: [28.7041, 77.1025], // Delhi
          name: "Delhi",
          style: {
            fill: "#8B5CF6",
            stroke: "#5B21B6",
          } as any,
        },
        {
          latLng: [12.9716, 77.5946], // Bangalore
          name: "Bangalore",
          style: {
            fill: "#EC4899",
            stroke: "#BE185D",
          } as any,
        },
        {
          latLng: [17.3850, 78.4867], // Hyderabad
          name: "Hyderabad",
          style: {
            fill: "#F59E0B",
            stroke: "#D97706",
          } as any,
        },
        {
          latLng: [13.0827, 80.2707], // Chennai
          name: "Chennai",
          style: {
            fill: "#10B981",
            stroke: "#059669",
          } as any,
        },
      ]}
      zoomOnScroll={false}
      zoomMax={8}
      zoomMin={1}
      zoomAnimate={true}
      zoomStep={1.5}
      regionStyle={{
        initial: {
          fill: mapColor || "#E5E7EB",
          fillOpacity: 1,
          fontFamily: "Outfit",
          stroke: "#9CA3AF",
          strokeWidth: 0.5,
          strokeOpacity: 0.3,
        },
        hover: {
          fillOpacity: 0.8,
          cursor: "pointer",
          fill: "#BFDBFE",
          stroke: "#3B82F6",
          strokeWidth: 1,
        },
        selected: {
          fill: "#93C5FD",
        },
        selectedHover: {},
      }}
      regionLabelStyle={{
        initial: {
          fill: "#374151",
          fontWeight: 500,
          fontSize: "11px",
          stroke: "none",
        },
        hover: {
          fill: "#1F2937",
        },
        selected: {},
        selectedHover: {},
      }}
    />
  );
};

export default CountryMap;