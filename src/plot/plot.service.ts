import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plot } from '../entities/Plot.entity';
import { BuildingPlot } from '../entities/BuildingPlot.entity';
import { RoadPlot } from '../entities/RoadPlot.entity';

@Injectable()
export class PlotService {
  constructor(
    @InjectRepository(Plot)
    private plotRepository: Repository<Plot>,
    @InjectRepository(BuildingPlot)
    private buildingPlotRepository: Repository<BuildingPlot>,
    @InjectRepository(RoadPlot)
    private roadPlotRepository: Repository<RoadPlot>,
  ) { }

  async getPlotDetails(idOrUid: string) {
    let plot = await this.plotRepository.findOne({ where: { id: idOrUid } });
    if (!plot) {
      plot = await this.plotRepository.findOne({ where: { uid: idOrUid } });
    }

    if (!plot) {
      throw new NotFoundException('Plot not found');
    }
    return plot;
  }

  async getAllMapData() {
    const [plots, buildings, roads] = await Promise.all([
      this.plotRepository.find(),
      this.buildingPlotRepository.find(),
      this.roadPlotRepository.find(),
    ]);

    return { plots, buildings, roads };
  }

  async getPlotsGeoJson() {
    console.log('PlotService: Fetching plots GeoJSON...');
    try {
      const rawData = await this.plotRepository.query(`
        SELECT p.id, p.uid, p.size_sqm, p.plot_type, p.plot_code, p.price, p.section_id, p.plot_name, p.status, 
               ST_AsGeoJSON(p.coordinates) as geojson,
               (SELECT string_agg(deceased_name, ', ') FROM graves g WHERE g.plot_id = p.id AND g.is_delete = false) as deceased_names
        FROM plots p
      `);
      console.log(`PlotService: Found ${rawData?.length} plots`);

      const features = rawData.map((row) => {
        let geometry = null;
        try {
          geometry = typeof row.geojson === 'string' ? JSON.parse(row.geojson) : row.geojson;
        } catch (e) {
          console.error(`Error parsing geojson for plot ${row.id}:`, e);
        }

        return {
          type: 'Feature',
          id: row.id,
          geometry: geometry,
          properties: {
            id: row.id,
            uid: row.uid,
            plot_name: row.plot_name,
            status: row.status,
            price: row.price,
            section_id: row.section_id,
            size_sqm: row.size_sqm,
            plot_code: row.plot_code,
            plot_type: row.plot_type,
            deceased_names: row.deceased_names
          },
        };
      });

      return {
        type: 'FeatureCollection',
        features,
      };
    } catch (err) {
      console.error('PlotService: Error in getPlotsGeoJson:', err);
      throw err;
    }
  }

  async getBuildingsGeoJson() {
    const rawData = await this.buildingPlotRepository.query(`
      SELECT id, uid, plot_name as name, plot_type as type, ST_AsGeoJSON(coordinates) as geojson 
      FROM building_plots
    `);

    return {
      type: 'FeatureCollection',
      features: rawData.map((row) => ({
        type: 'Feature',
        id: row.id,
        geometry: typeof row.geojson === 'string' ? JSON.parse(row.geojson) : row.geojson,
        properties: {
          id: row.id,
          uid: row.uid,
          name: row.name,
          type: row.type,
        },
      })),
    };
  }

  async getRoadsGeoJson() {
    const rawData = await this.roadPlotRepository.query(`
      SELECT id, uid, plot_name as name, plot_type as type, ST_AsGeoJSON(coordinates) as geojson 
      FROM road_plots
    `);

    return {
      type: 'FeatureCollection',
      features: rawData.map((row) => ({
        type: 'Feature',
        id: row.id,
        geometry: typeof row.geojson === 'string' ? JSON.parse(row.geojson) : row.geojson,
        properties: {
          id: row.id,
          uid: row.uid,
          name: row.name,
          type: row.type,
        },
      })),
    };
  }

  async updatePlotStatus(id: string, status: string) {
    const result = await this.plotRepository.update(id, {
      status,
      updated_at: new Date(),
    });
    if (result.affected === 0) throw new NotFoundException('Plot not found');
    return { success: true };
  }
}
