import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Papa from 'papaparse';
import { useEffect, useState } from 'react';

// Fix for default marker icon issues in React-Leaflet/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom colored icons
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const Map = () => {
    const position = [38.8275, -76.7516]; // Prince George's County approximate center
    const [potholes, setPotholes] = useState([]);
    const [snow, setSnow] = useState([]);

    useEffect(() => {
        const fetchPotholesAndSnow = async () => {
            try {
                const response = await fetch('/County_Click_311_-_Motorola_20260211.csv');
                const reader = response.body.getReader();
                const result = await reader.read();
                const decoder = new TextDecoder('utf-8');
                const csv = decoder.decode(result.value);

                Papa.parse(csv, {
                    header: true,
                    complete: (results) => {
                        const filteredPotholeData = results.data.filter(item => {
                            // Filter for Open status and Pothole Repair request name
                            const isOpen = item['Request Status']?.trim() === 'OPEN';
                            const isPothole = item['Request Name'] === 'Pothole Repair';
                            const hasCoords = item['Latitude'] && item['Longitude'];
                            return isOpen && isPothole && hasCoords;
                        });
                        const filteredSnowData = results.data.filter(item => {
                            // Filter for Open status and Snow Removal (Roadways) request name
                            const isOpen = item['Request Status']?.trim() === 'OPEN';
                            const isSnow = item['Request Name'] === 'Snow Removal (Roadways)';
                            const hasCoords = item['Latitude'] && item['Longitude'];
                            return isOpen && isSnow && hasCoords;
                        });
                        setPotholes(filteredPotholeData);
                        setSnow(filteredSnowData);
                    },
                    error: (error) => {
                        console.error('Error parsing CSV:', error);
                    }
                });
            } catch (error) {
                console.error('Error fetching CSV:', error);
            }
        };

        fetchPotholesAndSnow();
    }, []);

    return (
        <div style={{ height: '500px', width: '100%' }}>
            <MapContainer center={position} zoom={10} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {potholes.map((pothole, index) => (
                    <Marker
                        key={`pothole-${index}`}
                        position={[parseFloat(pothole['Latitude']), parseFloat(pothole['Longitude'])]}
                        icon={redIcon}
                    >
                        <Popup>
                            <strong>{pothole['Request Name']}</strong><br />
                            Status: {pothole['Request Status']}<br />
                            Address: {pothole['Street Address']}
                        </Popup>
                    </Marker>
                ))}
                {snow.map((snowItem, index) => (
                    <Marker
                        key={`snow-${index}`}
                        position={[parseFloat(snowItem['Latitude']), parseFloat(snowItem['Longitude'])]}
                        icon={blueIcon}
                    >
                        <Popup>
                            <strong>{snowItem['Request Name']}</strong><br />
                            Status: {snowItem['Request Status']}<br />
                            Address: {snowItem['Street Address']}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default Map;
