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
  ) {}

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
    const rawData = await this.plotRepository.query(`
      SELECT id, uid, plot_name, status, price, section_id, ST_AsGeoJSON(coordinates) as geojson 
      FROM plots
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
          plot_name: row.plot_name,
          status: row.status,
          price: row.price,
          section_id: row.section_id,
        },
      })),
    };
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
