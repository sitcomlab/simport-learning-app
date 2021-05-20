# gather some descriptive stats & plots for the csv output
# of the anonymize_trajectory.ts script

# install.packages(c('readr', 'dplyr'))
library(dplyr)
library(readr)

inputfile = commandArgs(trailingOnly = TRUE)[1]

dt = read_csv(inputfile)
HOUR = 60*60
dtf = filter(dt, d_seconds <  HOUR*3) # remove long gaps

png('anon_traj.png', width=1600, height=1200)
plot(dt)
dev.off()

png('anon_traj_filtered.png', width=1600, height=1200)
plot(dtf)
dev.off()

png('anon_traj_time.png', width=800, height=800)
plot(dtf$time, dtf$d_seconds)
dev.off()

summary(dt)

