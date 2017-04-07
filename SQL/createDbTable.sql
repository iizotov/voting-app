USE [master]
GO

/****** Object:  Database [voterraw]    Script Date: 7/04/2017 4:11:27 PM ******/
CREATE DATABASE [voterraw]
GO

USE [voterraw]
GO

/****** Object:  Table [dbo].[raw]    Script Date: 7/04/2017 4:11:00 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[raw](
	[row_id] [bigint] IDENTITY(1,1) NOT NULL,
	[device] [nvarchar](max) NOT NULL,
	[acceleration] [float] NOT NULL,
	[dt] [datetime] NOT NULL,
 CONSTRAINT [PK_raw] PRIMARY KEY CLUSTERED 
(
	[row_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)
)

GO


