ActiveAdmin.register_page "Dashboard" do

  menu priority: 0, label: proc{ I18n.t("active_admin.dashboard") }

  content title: proc{ I18n.t("active_admin.dashboard") } do
    columns do
       column do
         panel "Analistas" do
           #table_for Doodle::User::Analyst.joins(:user_channels).where('doodle_user_channels.status' => 'online') do
           panel "Ativos" do
             table_for [ {login: 'aladdin', protocols_number: 17} ] do
               column :login
               column :protocols_number
             end
           end
           panel "Em Espera" do
             table_for [ {login: 'aladdin'} ] do
               column :login
             end
            end
         end
       end

       column do
         panel "Número de protocolos em cada fila" do

         end
       end

       column do
         panel "Número de protocolos por status" do
         end
       end
     end
  end
end
