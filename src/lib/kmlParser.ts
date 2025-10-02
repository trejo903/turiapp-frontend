// src/lib/kmlParser.ts
export interface KMLRoute {
  name: string;
  description: string;
  coordinates: { latitude: number; longitude: number; altitude: number }[];
  color: string;
  width: number;
}

export function parseKML(kmlString: string): KMLRoute | null {
  try {
    // Extraer nombre y descripción
    const nameMatch = kmlString.match(/<name>([^<]*)<\/name>/);
    const descMatch = kmlString.match(/<description>([^<]*)<\/description>/);
    
    // Extraer coordenadas
    const coordsMatch = kmlString.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
    if (!coordsMatch) return null;

    // Parsear coordenadas
    const coordsText = coordsMatch[1].trim();
    const coordinates = coordsText.split(/\s+/)
      .filter(coord => coord.trim().length > 0)
      .map(coord => {
        const [longitude, latitude, altitude] = coord.split(',').map(Number);
        return { latitude, longitude, altitude: altitude || 0 };
      });

    // Extraer color y ancho (del KML proporcionado)
    const color = '#F9A825'; // Color naranja del KML
    const width = 4;

    return {
      name: nameMatch ? nameMatch[1] : 'Ruta',
      description: descMatch ? descMatch[1] : '',
      coordinates,
      color,
      width
    };
  } catch (error) {
    console.error('Error parsing KML:', error);
    return null;
  }
}

// KML hardcodeado basado en tu ejemplo
export const ANARANJADOS_CIMA_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>ANARANJADOS CIMA</name>
    <description>RUTA: CIMA</description>
    <Style id="line-F9A825-8363-normal">
      <LineStyle>
        <color>ff25a8f9</color>
        <width>8.363</width>
      </LineStyle>
    </Style>
    <Style id="line-F9A825-8363-highlight">
      <LineStyle>
        <color>ff25a8f9</color>
        <width>12.5445</width>
      </LineStyle>
    </Style>
    <StyleMap id="line-F9A825-8363">
      <Pair>
        <key>normal</key>
        <styleUrl>#line-F9A825-8363-normal</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#line-F9A825-8363-highlight</styleUrl>
      </Pair>
    </StyleMap>
    <Folder>
      <name>Untitled layer</name>
      <Placemark>
        <name>Anaranjados </name>
        <description>RUTA: CIMA</description>
        <styleUrl>#line-F9A825-8363</styleUrl>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>
            -104.6270115,24.0613282,0
            -104.6309168,24.0593297,0
            -104.6291359,24.056273,0
            -104.6288998,24.055744,0
            -104.6271832,24.0527657,0
            -104.625016,24.0489055,0
            -104.6239646,24.0469656,0
            -104.6350367,24.0369519,0
            -104.6384914,24.033738,0
            -104.6392587,24.0334391,0
            -104.63972,24.0333411,0
            -104.6404764,24.0334097,0
            -104.6409592,24.0334244,0
            -104.6425739,24.0336449,0
            -104.6464524,24.0341299,0
            -104.6502611,24.0345708,0
            -104.6522728,24.0347913,0
            -104.6539465,24.0349971,0
            -104.65422,24.0350216,0
            -104.6547243,24.0350608,0
            -104.6565428,24.0352714,0
            -104.6571222,24.0350804,0
            -104.6575245,24.0350167,0
            -104.6576372,24.0348648,0
            -104.6574387,24.0345512,0
            -104.657385,24.0343259,0
            -104.6572241,24.0335077,0
            -104.6568486,24.0314009,0
            -104.656575,24.0299066,0
            -104.6564731,24.0293726,0
            -104.6598044,24.0286082,0
            -104.6602872,24.0284661,0
            -104.6606842,24.0283192,0
            -104.6615383,24.0281632,0
            -104.662697,24.0279672,0
            -104.6640703,24.02783,0
            -104.6644994,24.0277712,0
            -104.665465,24.0274969,0
            -104.6669885,24.0272421,0
            -104.6688553,24.0270853,0
            -104.6696064,24.0270069,0
            -104.6694347,24.026125,0
            -104.6692201,24.0247531,0
            -104.6690914,24.0234987,0
            -104.6689412,24.0222836,0
            -104.6605298,24.0237143,0
            -104.6530839,24.0248706,0
            -104.652569,24.024949,0
            -104.6541354,24.034944,0
            -104.6455952,24.0339446,0
            -104.6423551,24.033533,0
            -104.6391794,24.0331411,0
            -104.6388146,24.0331607,0
            -104.6243092,24.0462707,0
            -104.623644,24.0468586,0
            -104.6290026,24.0562909,0
            -104.6315454,24.0547037,0
            -104.6328006,24.0571922,0
            -104.633895,24.0592299,0
            -104.6319209,24.0610913,0
            -104.6309231,24.0594063,0
            -104.6271251,24.0613754,0
          </coordinates>
        </LineString>
      </Placemark>
    </Folder>
  </Document>
</kml>`;