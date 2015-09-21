using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DMSLib;
using System.IO;
using System.Drawing;

namespace NWCArt
{
    class NWCArt
    {
        EPSFile m_file;
        public NWCArt(EPSFile file)
        {
            m_file = file;
        }

        public void DrawBox(String fillStr, String outlineStr, GridSpace grid)
        {
            m_file.DrawPoly(fillStr, outlineStr, new Path(grid[0, 0], grid[0, 1], grid[1, 1], grid[1, 0]));
        }

        public GridSpace ExtractOvoid(GridSpace grid)
        {
            return new GridSpace(
                new Path(grid[0.116, 0.054],
                        grid[0.884, 0.054]),
                new Path(grid[0.009, 0.484],
                        grid[0.188, 0.860],
                        grid[0.500, 1.000],
                        grid[0.813, 0.860],
                        grid[0.991, 0.484]));
        }

        public GridSpace ExtractUform(GridSpace grid)
        {
            return new GridSpace(
                new Path(grid[0.0, 0.0],
                         grid[1.0, 0.0]),
                new Path(grid[0.1333, 0.89],
                         grid[0.8666, 0.89]));
        }


        public void DrawOvoidInBox(String fillStr, String outlineStr, GridSpace grid)
        {
            m_file.DrawClosedCatmullRomSpline(fillStr, outlineStr,
                        new Path(grid[0.116, 0.054],
                                grid[0.009, 0.484],
                                grid[0.188, 0.860],
                                grid[0.500, 1.000],
                                grid[0.813, 0.860],
                                grid[0.991, 0.484],
                                grid[0.884, 0.054]));
        }

        public void DrawEyeInBox(String fillStr, String outlineStr, GridSpace grid, double thickness)
        {
            m_file.DrawCatmullRomSplines(fillStr, outlineStr,
                        new Path(grid[-0.10, 0.400],
                                grid[0.000, 0.500],
                                grid[0.188, 0.860],
                                grid[0.500, 1.000],
                                grid[0.813, 0.860],
                                grid[1.000, 0.500],
                                grid[1.100, 0.400]),
                        new Path(grid[1.100, 0.400],
                                grid[1.000, 0.300],
                                grid[0.884, 0.054],
                                grid[0.500, 0.000],
                                grid[0.116, 0.054],
                                grid[0.000, 0.300],
                                grid[-0.10, 0.400]));
            grid = grid.Inset(thickness, InsetType.AllSides);
            DrawOvoidInBox(outlineStr, "none", grid);
            DrawOvoidInBox(fillStr, "none", grid.Inset(thickness, InsetType.AllSides));
            DrawOvoidInBox(outlineStr, "none", grid.Inset(thickness * 2, InsetType.CupUp));
        }

        public void DrawUformInBox(String fillStr, String outlineStr, GridSpace grid)
        {
            m_file.DrawCatmullRomSplines(fillStr, outlineStr,
                        new Path(grid[0.0, 0.0],
                                grid[0.1333, 0.89],
                                grid[0.8666, 0.89],
                                grid[1.0, 0.0]),
                        grid.m_bottomPath.reversed());
        }

        public void DrawSplitInBox(String fillStr, String outlineStr, GridSpace grid)
        {
            m_file.DrawCatmullRomSplines(fillStr, outlineStr,
                        new Path(grid[0.0, 0.0],
                                grid[0.083333333, 0.1],
                                grid[0.416666667, 0.32],
                                grid[0.5, 0.86]),
                        new Path(grid[0.5, 0.86],
                                grid[0.583333333, 0.32],
                                grid[0.916666667, 0.1],
                                grid[1.0, 0.0]),
                        grid.m_bottomPath.reversed());
        }

        public void DrawEyeSocket(GridSpace grid, double thickness)
        {
            DrawOvoidInBox("black", "none", grid);
            grid = grid.Inset(thickness, InsetType.AllSides);
            DrawOvoidInBox("white", "none", grid);
            grid = grid.Inset(thickness, InsetType.AllSides);
            DrawEyeInBox("white", "black", grid, thickness * 0.5);
        }

        public void DrawStackedUform(string fillStr, string outlineStr, GridSpace grid, double thickness)
        {
            DrawUformInBox(outlineStr, "none", grid);
            DrawSplitInBox(fillStr, "none", grid.Inset(thickness, InsetType.TopHalf));
            //DrawUformInBox(fillStr, "none", grid.Inset(thickness, InsetType.TopHalf));
            //DrawOvoidInBox(fillStr, "none", grid.Inset(thickness, InsetType.TopHalf));
            DrawUformInBox(fillStr, "none", grid.Inset(thickness, InsetType.BottomHalf));
            grid = grid.Inset(thickness, InsetType.BottomHalf);
            DrawOvoidInBox(outlineStr, "none", grid.Inset(thickness, InsetType.TopHalf));
            DrawUformInBox(outlineStr, "none", grid.Inset(thickness, InsetType.BottomHalf));


        }
        public void DrawBakersUform1(GridSpace grid, double thickness)
        {
            DrawUformInBox("black", "none", grid);
            grid = grid.Inset(thickness, InsetType.BottomFixed); DrawUformInBox("white", "none", grid);
            grid = grid.Inset(thickness, InsetType.BottomFixed); DrawUformInBox("white", "black", grid);

            GridSpace leftgrid = grid.Inset(thickness*0.65, InsetType.LeftHalf);
            DrawStackedUform("white", "red", leftgrid, thickness);

            GridSpace rightgrid = grid.Inset(thickness * 0.65, InsetType.RightHalf);
            DrawStackedUform("white", "red", rightgrid, thickness);
        }

        public void DrawSun(double radius, double thickness)
        {
            Path circle = new Path();
            Point2D center = new Point2D(595, 842) / 2.0;
            for (int i = 0; i < 50; i++)
            {
                double t = (double)i / 50 * Math.PI * 2.0;
                circle.AddControlPt(center + Point2D.FromPolar(radius, t - Math.PI / 2.0));
            }
            for (int i = 0; i < 7; i++)
            {
                Path subPath = circle.subPathOvoid((double)(i + 0.5) / 8.0, (double)(i + 1.5) / 8.0);
                if (i % 2 == 0)
                {
                    GridSpace ray = GridSpace.fromPath(subPath, -2.0 * radius, radius * 1.0);
                    DrawStackedUform("white", "black", ray, thickness);
                }
                else
                {
                    GridSpace ray = GridSpace.fromPath(subPath, -2.0 * radius, radius * 0.75);
                    DrawBakersUform1(ray, thickness);
                }
            }
            m_file.DrawCircle(center, radius, "black", "none");
            m_file.DrawCircle(center, radius - thickness*0.6, "white", "none");
            DrawEyeInBox( "white", "black", 
                          new GridSpace(center + new Point2D(radius * -0.75, 0),
                                        center + new Point2D(-thickness * 0.6, 0),
                                        center + new Point2D(radius * -0.75, radius * 0.5),
                                        center + new Point2D(-thickness * 0.6, radius * 0.5)),
                          thickness*0.6);
            DrawEyeInBox( "white", "black", 
                          new GridSpace(center + new Point2D(thickness * 0.6, 0),
                                        center + new Point2D(radius * 0.75, 0),
                                        center + new Point2D(thickness * 0.6, radius * 0.5),
                                        center + new Point2D(radius * 0.75, radius * 0.5)),
                          thickness*0.6);
        }
    }
}